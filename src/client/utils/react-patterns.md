# Idiomatic React Patterns for Complex State

## The Problem with Classes in React

React's `useOptimistic` is designed for **plain objects**, not class instances. Classes go against React's functional programming philosophy, which is why we need awkward `structuredClone` + prototype restoration.

## Better Approaches

### Option 1: Plain Objects + Pure Functions (Most React-like)

```typescript
// Instead of GameModel class, use plain objects
type GameState = {
  id?: number;
  players: string[];
  phase: Phase;
  currentTurn: Player;
  board: Board;
  scoring: ScoringState;
  info: GameInfo;
};

// Pure functions operate on data
const groupSelected = (state: GameState, selected: Position[]): GameState => {
  return {
    ...state,
    scoring: {
      ...state.scoring,
      groups: {
        ...state.scoring.groups,
        [state.currentTurn]: [...state.scoring.groups[state.currentTurn], selected]
      },
      numCellsGrouped: {
        ...state.scoring.numCellsGrouped,
        [state.currentTurn]: state.scoring.numCellsGrouped[state.currentTurn] + selected.length
      }
    }
  };
};

// Reducer works with plain objects - useOptimistic handles cloning automatically!
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'group':
      return groupSelected(state, action.selected);
    case 'move':
      return makeMove(state, action.pos);
    default:
      return state;
  }
};

// No more cloning needed!
const { optimisticState } = useOptimistic(gameState, gameReducer);
```

### Option 2: Immer for Complex Updates

```typescript
import { produce } from 'immer';

const gameReducer = (state: GameState, action: GameAction): GameState => {
  return produce(state, draft => {
    switch (action.type) {
      case 'group':
        // Mutate draft directly - Immer handles immutability
        draft.scoring.groups[draft.currentTurn].push(action.selected);
        draft.scoring.numCellsGrouped[draft.currentTurn] += action.selected.length;
        
        // Complex logic becomes simple
        if (draft.scoring.numCellsGrouped[draft.currentTurn] >= draft.info.size / 2) {
          draft.phase = 'End';
        }
        break;
    }
  });
};
```

### Option 3: Modern State Management (Zustand)

```typescript
import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  game: initialGameState,
  
  groupSelected: (selected: Position[]) => set(state => ({
    game: produce(state.game, draft => {
      draft.scoring.groups[draft.currentTurn].push(selected);
      draft.scoring.numCellsGrouped[draft.currentTurn] += selected.length;
    })
  })),
  
  // Built-in optimistic updates
  optimisticGroupSelected: (selected: Position[]) => {
    const originalState = get().game;
    get().groupSelected(selected); // Apply optimistically
    
    return api.groupSelected(selected).catch(() => {
      set({ game: originalState }); // Revert on error
    });
  }
}));
```

## Why These Are Better

1. **No cloning needed** - React handles it automatically
2. **Functional programming** - Aligns with React's philosophy  
3. **Better TypeScript support** - Plain objects are easier to type
4. **Easier testing** - Pure functions are trivial to test
5. **Better performance** - React can optimize plain object updates
6. **Ecosystem compatibility** - Works with all React tools (DevTools, etc.)

## Migration Strategy

You could gradually migrate by:
1. Extract GameModel methods to pure functions
2. Convert GameModel properties to plain objects
3. Use the pure functions with plain objects
4. Remove the class entirely

This would eliminate the need for any custom cloning logic! 
