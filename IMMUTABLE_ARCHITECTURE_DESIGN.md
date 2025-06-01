# Immutable Architecture Design

## Overview

This document outlines our approach to achieving consistent, immutable state management across our full-stack TypeScript game application, using shared business logic between client and server while maintaining clean developer experience.

## Design Goals & Priorities

### Primary Goals
1. **Consistent Patterns**: Identical APIs and behavior between frontend and backend
2. **Shared Business Logic**: Single source of truth for game rules and validation
3. **Clean Developer Experience**: Simple method calls like `game.makeMove(pos)`
4. **Type Safety**: Compile-time guarantees without runtime string constants
5. **Immutability**: All state changes return new instances for React compatibility

### Secondary Goals
- **Performance**: Fast immutable updates without excessive cloning
- **Testability**: Easy unit testing with pure function behavior
- **Maintainability**: Minimal boilerplate and architectural complexity

## Non-Goals

We explicitly **do not** want:
- ❌ **String-based action types** - No `{ type: 'MOVE', payload: pos }`
- ❌ **Middleware architecture** - No interceptors, logging, or cross-cutting concerns
- ❌ **Centralized dispatching** - No single reducer handling all state changes
- ❌ **Complex patterns** - No command objects, decorators, or proxy magic

## Technical Approach

### Core Technologies
- **Mutative**: Fast immutable updates with familiar Immer-like syntax
- **Function-based Actions**: React optimistic updates using functions instead of string actions
- **Shared GameModel**: Single class used across client, server, and tests

### Architecture Pattern

```
Shared Business Logic (GameModel)
├── Server Routes (Express)
│   └── game.method() → database save
├── Client Components (React)
│   └── game.method() → optimistic updates  
└── Tests
    └── game.method() → assertions
```

## Current State vs Target State

### Current Issues
```typescript
// ❌ Inconsistent patterns
// Server: mutation
game.groupSelected(selected);
await gameDb.setGame(game);

// Client: cloning
return currentGame.clone().groupSelected(action.selected);

// ❌ String-based actions
{ type: 'group', selected: Position[] }

// ❌ Manual cloning logic
const cloned = structuredClone(this);
Object.setPrototypeOf(cloned, Object.getPrototypeOf(this));
```

### Target State
```typescript
// ✅ Identical patterns everywhere
const updatedGame = game.groupSelected(selected);

// ✅ Function-based actions
(game: GameModel) => game.groupSelected(selected)

// ✅ Automatic immutability
return create(this, draft => {
  draft.scoring.groups[draft.currentTurn].push(selected);
});
```

## Implementation Plan

### Phase 1: Mutative Migration

#### 1.1 Install Dependencies
```bash
npm install mutative
```

#### 1.2 Update GameModel Methods
**File**: `src/domain/game.ts`

**Before**:
```typescript
groupSelected(selected: Position[]): GameModel {
  // validation...
  this.scoring.groups[this.currentTurn].push(selected);
  // mutations...
  return this;
}

clone(): GameModel {
  const cloned = structuredClone(this);
  Object.setPrototypeOf(cloned, Object.getPrototypeOf(this));
  return cloned;
}
```

**After**:
```typescript
import { create } from 'mutative';

groupSelected(selected: Position[]): GameModel {
  return create(this, draft => {
    // validation using this.method() (original instance)
    if (!this.validateGroupSelection(selected)) return;
    
    // mutations on draft
    draft.scoring.groups[draft.currentTurn].push(selected);
    draft.scoring.numCellsGrouped[draft.currentTurn] += selected.length;
    // ... rest of logic
  });
}

// Remove clone() method entirely
```

**Methods to Update**:
- `groupSelected()`
- `makeMove()`  
- `randomizeBoard()`

#### 1.3 Server Route Consistency
**File**: `src/server/routes.ts`

**Before**:
```typescript
// Inconsistent: some mutate, some return
game.groupSelected(selected);        // mutation
const gameModel = game.makeMove(pos); // return value
```

**After**:
```typescript
// All routes follow same pattern
const updatedGame = game.groupSelected(selected);
await gameDb.setGame(updatedGame);

const updatedGame = game.makeMove(pos);  
await gameDb.setGame(updatedGame);
```

### Phase 2: React Pattern Update

#### 2.1 Function-Based Actions
**File**: `src/client/GameView.tsx`

**Before**:
```typescript
type GameAction = 
  | { type: 'move', pos: Position }
  | { type: 'group', selected: Position[] };

const gameActionReducer = (currentGame: GameModel, action: GameAction): GameModel => {
  switch (action.type) {
    case 'move': return currentGame.clone().makeMove(action.pos);
    case 'group': return currentGame.clone().groupSelected(action.selected);
  }
};
```

**After**:
```typescript
type GameAction = (game: GameModel) => GameModel;

const gameActionReducer = (game: GameModel, action: GameAction): GameModel => {
  return action(game);
};
```

#### 2.2 Component Updates
**File**: `src/client/GameView.tsx`

**Before**:
```typescript
executeAction(
  { type: 'move', pos },
  () => api.makeMove(pos),
  setNewGame,
  () => isValidMove(optimisticGame, pos)
);
```

**After**:
```typescript
executeAction(
  (game: GameModel) => game.makeMove(pos),
  () => api.makeMove(pos), 
  setNewGame,
  () => isValidMove(optimisticGame, pos)
);
```

#### 2.3 Remove Helper Functions
**File**: `src/client/GameView.tsx`

Remove these (no longer needed):
- `createMoveAction()`
- `createGroupAction()`
- `isAlreadyGrouped()` - validation moves to GameModel
- `isValidGroupAction()` - validation moves to GameModel

#### 2.4 Remove Cloning Utilities
**File**: `src/client/utils/state.ts`

Remove:
- `cloneGameModelOptimistically()` function
- Associated warning comments

### Phase 3: Validation Consolidation

#### 3.1 Move Validation to GameModel
**File**: `src/domain/game.ts`

```typescript
class GameModel {
  groupSelected(selected: Position[]): GameModel {
    return create(this, draft => {
      // All validation in one place
      if (selected.length === 0) return;
      if (selected.some(pos => this.getCell(pos) !== this.currentTurn)) return;
      if (!isValidGroupSelection(this, selected)) return;
      
      // Apply changes
      draft.scoring.groups[draft.currentTurn].push(selected);
      // ...
    });
  }
}
```

This eliminates client-side validation duplication.

## Usage Patterns by Site

### Server Routes
```typescript
router.post("/group", async (req, res) => {
  const game = await gameDb.getGame();
  if (!game) throw new Error("game not initialized");
  
  try {
    const updatedGame = game.groupSelected(req.body.selected);
    await gameDb.setGame(updatedGame);
    res.send(superjson.stringify(updatedGame));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
```

### React Components
```typescript
const handleMove = useCallback((pos: Position) => () => {
  executeAction(
    (game: GameModel) => game.makeMove(pos),
    () => api.makeMove(pos),
    setNewGame
  );
}, []);

const handleGroup = useCallback(() => {
  const selectedPositions = Array.from(selected.values());
  executeAction(
    (game: GameModel) => game.groupSelected(selectedPositions),
    () => api.groupSelected(selectedPositions),
    setNewGame
  );
  clearSelection();
}, []);
```

### Tests
```typescript
test('groupSelected creates new instance', () => {
  const initialGame = GameModel.initGame(3);
  const result = initialGame.groupSelected([[0, 0, 0]]);
  
  expect(result).not.toBe(initialGame);
  expect(result.scoring.groups[1]).toHaveLength(1);
});

test('invalid group selection returns same instance', () => {
  const game = GameModel.initGame(3);
  const result = game.groupSelected([]); // empty selection
  
  expect(result).toBe(game); // Same reference for invalid operations
});
```

### Database Layer
```typescript
// No changes needed - toRecord() and constructor stay the same
async setGame(game: GameModel) {
  const record = game.toRecord();
  await this.db.update(gamesTable).set(record).where(eq(gamesTable.id, record.id));
}

async getGame(): Promise<GameModel | undefined> {
  const game = await this.db.query.gamesTable.findFirst({...});
  return game ? new GameModel(game) : undefined;
}
```

## Migration Checklist

### Phase 1: Mutative (Breaking Changes)
- [ ] Install mutative
- [ ] Update `groupSelected()` method
- [ ] Update `makeMove()` method  
- [ ] Update `randomizeBoard()` method
- [ ] Remove `clone()` method
- [ ] Update server `/group` route to use assignment
- [ ] Test server endpoints
- [ ] Test database persistence

### Phase 2: React Pattern (Breaking Changes)
- [ ] Update `GameAction` type to function
- [ ] Simplify `gameActionReducer` to one line
- [ ] Update `handleMove` action creation
- [ ] Update `makeGroup` action creation
- [ ] Remove action creator functions
- [ ] Remove client-side validation helpers
- [ ] Remove cloning utilities
- [ ] Test optimistic updates
- [ ] Test error handling

### Phase 3: Validation (Non-Breaking)
- [ ] Move remaining validation to GameModel methods
- [ ] Remove duplicate validation from client
- [ ] Add comprehensive tests for edge cases
- [ ] Document validation rules

## Benefits Achieved

### Developer Experience
- **Consistent API**: `game.method()` everywhere
- **No strings**: Type-safe method calls only
- **Less boilerplate**: No action creators or string constants
- **Simple testing**: Direct method calls in tests

### Technical Benefits  
- **Performance**: Mutative is faster than manual cloning
- **Type Safety**: Compile-time guarantees for all state changes
- **Maintainability**: Single source of truth for business logic
- **React Integration**: Clean optimistic updates without cloning complexity

### Architecture Benefits
- **Shared Logic**: Validation and business rules in one place
- **Immutability**: All operations return new instances
- **Predictability**: Same behavior across client, server, and tests
- **Simplicity**: Minimal architectural complexity

This design achieves our goal of consistent, clean, type-safe state management while maintaining the encapsulated, method-calling developer experience we prefer. 
