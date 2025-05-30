export type ApiError = {
    status: number;
    message: string;
};

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NotFoundError";
    }
}
