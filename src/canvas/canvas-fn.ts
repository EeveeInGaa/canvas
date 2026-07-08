export function createId(): string {
    return crypto.randomUUID();
}

export function clampSize(value: number): number {
    return Math.max(80, value);
}