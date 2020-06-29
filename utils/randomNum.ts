export default function (min: number = 0, max: number = 1): number {
    return min + Math.floor(Math.random() * max)
}