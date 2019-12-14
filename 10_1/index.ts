type Pair<A, B> = [A, B];

interface Array<T> {
    flatMap<R>(transform: (it: T, index: number) => Array<R>): Array<R>

    copy(): Array<T>

    count(predicate: (it: T, index: number, array: Array<T>) => boolean): bigint
}

interface Number {
    isBetween(a: number | bigint, b: number | bigint, inclusive?: boolean): boolean
}
Array.prototype.flatMap = function flatMap<T, R>(this: Array<T>, transform: (it: T, index: number) => Array<R>): Array<R> {
    let result = [];
    this.forEach((it, index) => {
        result = result.concat(transform(it, index))
    });
    return result;
};
Array.prototype.copy = function copy<T>(this: Array<T>): Array<T> {
    return [].concat(this);
};
Array.prototype.count = function count<T>(this: Array<T>, predicate: (it: T, index: number, array: Array<T>) => boolean): bigint {
    let count = 0n;
    this.forEach((value, index, array) => {
        if (predicate(value, index, array)) count++;
    });
    return count;
};
Number.prototype.isBetween = function isBetween(this: number, a: number | bigint, b: number | bigint, inclusive: boolean = false): boolean {
    return a < this && this < b || (inclusive && a <= this && b <= this);
};

type Int = bigint

class Vector {
    readonly length?: number;

    constructor(readonly x: Int, readonly y: Int, setLength: boolean = false) {
        if (setLength) this.length = Math.sqrt(Number(x * x + y * y));
    }

    canSee(other: Vector, withBlockers: Array<Vector>): boolean {
        if (this.equals(other)) return false;
        const distance = this.minus(other);
        //console.log(this, other, 'can see? distance:', distance);
        for (const it of withBlockers) {
            if (distance.scalarTo(this.minus(it)).isBetween(0, 1)) {
                return false;
            }
        }
        return true;
    }

    equals(other: Vector): boolean {
        return this.x == other.x && this.y == other.y;
    }

    minus(other: Vector): Vector {
        return new Vector(other.x - this.x, other.y - this.y, true);
    }

    scalarTo(other: Vector): number {
        if ((this.x == 0n && other.x == 0n) || (this.y == 0n && other.y == 0n))
            return (Number(other.x) / Number(this.x)) || (Number(other.y) / Number(this.y));
        return (Number(other.y) == (Number(this.y) * Number(other.x)) / Number(this.x) || Number(other.x) == (Number(this.x) * Number(other.y)) / Number(this.y))
            ? Number(other.x) / Number(this.x) : Infinity;
    }
}

const input: Array<Vector> = (".#....#.###.........#..##.###.#.....##...\n" +
    "...........##.......#.#...#...#..#....#..\n" +
    "...#....##..##.......#..........###..#...\n" +
    "....#....####......#..#.#........#.......\n" +
    "...............##..#....#...##..#...#..#.\n" +
    "..#....#....#..#.....#.#......#..#...#...\n" +
    ".....#.#....#.#...##.........#...#.......\n" +
    "#...##.#.#...#.......#....#........#.....\n" +
    "....##........#....#..........#.......#..\n" +
    "..##..........##.....#....#.........#....\n" +
    "...#..##......#..#.#.#...#...............\n" +
    "..#.##.........#...#.#.....#........#....\n" +
    "#.#.#.#......#.#...##...#.........##....#\n" +
    ".#....#..#.....#.#......##.##...#.......#\n" +
    "..#..##.....#..#.........#...##.....#..#.\n" +
    "##.#...#.#.#.#.#.#.........#..#...#.##...\n" +
    ".#.....#......##..#.#..#....#....#####...\n" +
    "........#...##...#.....#.......#....#.#.#\n" +
    "#......#..#..#.#.#....##..#......###.....\n" +
    "............#..#.#.#....#.....##..#......\n" +
    "...#.#.....#..#.......#..#.#............#\n" +
    ".#.#.....#..##.....#..#..............#...\n" +
    ".#.#....##.....#......##..#...#......#...\n" +
    ".......#..........#.###....#.#...##.#....\n" +
    ".....##.#..#.....#.#.#......#...##..#.#..\n" +
    ".#....#...#.#.#.......##.#.........#.#...\n" +
    "##.........#............#.#......#....#..\n" +
    ".#......#.............#.#......#.........\n" +
    ".......#...##........#...##......#....#..\n" +
    "#..#.....#.#...##.#.#......##...#.#..#...\n" +
    "#....##...#.#........#..........##.......\n" +
    "..#.#.....#.....###.#..#.........#......#\n" +
    "......##.#...#.#..#..#.##..............#.\n" +
    ".......##.#..#.#.............#..#.#......\n" +
    "...#....##.##..#..#..#.....#...##.#......\n" +
    "#....#..#.#....#...###...#.#.......#.....\n" +
    ".#..#...#......##.#..#..#........#....#..\n" +
    "..#.##.#...#......###.....#.#........##..\n" +
    "#.##.###.........#...##.....#..#....#.#..\n" +
    "..........#...#..##..#..##....#.........#\n" +
    "..#..#....###..........##..#...#...#..#..")
    .split("\n")
    .flatMap((it, y) => it
        .split("")
        .map((s, x) => [s, new Vector(BigInt(x), BigInt(y))] as Pair<string, Vector>)
        .filter(a => a[0] != '.').map(a => a[1])
    );

const output = input
    .map((it, _, array) =>
        [array.count(other => it.canSee(other, array)), it] as Pair<bigint, Vector>
    )
    .sort((a, b) => Number(b[0] - a[0]));
console.log(output);
