type Pair<A, B> = [A, B];

interface Array<T> {
    flatMap<R>(transform: (it: T, index: number) => Array<R>): Array<R>

    copy(): Array<T>

    count(predicate: (it: T, index: number, array: Array<T>) => boolean): bigint

    insertSorted(x: T, compare: (a: T, x: T) => number): this

    insertAt(index: number, x: T): this
}

interface Number {
    isBetween(a: number | bigint, b: number | bigint, inclusive?: boolean): boolean
}

interface BigInt {
    abs(): bigint
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
Array.prototype.insertSorted = function insertSorted<T>(this: Array<T>, x: T, compare: (a: T, x: T) => number): Array<T> /*this*/ {
    let index = 0;
    for (; index < this.length && compare(this[index], x) < 0; index++) {}
    this.insertAt(index, x);
    return this;
};
Array.prototype.insertAt = function insertAt<T>(this: Array<T>, index: number, x: T): Array<T> /*this*/ {
    this.push(x, ...this.splice(index));
    return this;
};
Number.prototype.isBetween = function isBetween(this: number, a: number | bigint, b: number | bigint, inclusive: boolean = false): boolean {
    return a < this && this < b || (inclusive && a <= this && b <= this);
};
BigInt.prototype.abs = function abs(this: bigint): bigint {
    return (this < 0) ? -this : this;
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

    normalized(): Vector {
        const gcd = Vector.gcd(this.x.abs(), this.y.abs());
        return new Vector(this.x / gcd, this.y / gcd);
    }

    angleToY(): number {
        return (360 - ((270 - Math.atan2(Number(this.y), Number(this.x)) * 180 / Math.PI) % 360)) % 360;
    }

    private static gcd(a: Int, b: Int): Int {
        if (a == 0n) return b;
        return Vector.gcd(b%a, a);
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
        .filter(a =>  a[0] == '#').map(a => a[1])
    );

const laser = new Vector(28n, 29n);
const map: Map<bigint, Map<bigint, Array<Vector>>> = new Map<bigint, Map<bigint, Array<Vector>>>();
input.sort((a, b) => a.minus(laser).length - b.minus(laser).length).slice(1).forEach(it => {
    const direction = laser.minus(it).normalized();
    const yMap = map.get(direction.x) || new Map<bigint, Array<Vector>>();
    const directionVectors = yMap.get(direction.y) || [];
    directionVectors.push(it);
    yMap.set(direction.y, directionVectors);
    map.set(direction.x, yMap);
});
const sortedVectorArray: Array<Pair<Vector, Array<Vector>>> = [];
map.forEach((yMap, x) => {
    yMap.forEach((coordinates, y) => {
        sortedVectorArray.insertSorted([new Vector(x, y), coordinates] as Pair<Vector, Array<Vector>>, (a, b) => {
            return a[0].angleToY() - b[0].angleToY();
        })
    })
});
//console.log(sortedVectorArray.map(it => `(${it[0].x}, ${it[0].y}) [${it[0].angleToY()}] => ${it[1].map(v => `(${v.x}, ${v.y})`)}`));

const sortedArray: Array<Array<Vector>> = sortedVectorArray.map(it => it[1]);
const maxVaporized = 200;
let vaporized = 0;
let index = 0;
while (vaporized < maxVaporized && sortedArray.length > 0) {
    console.log('vaporizing', vaporized++, sortedArray[index][0]);
    sortedArray[index].shift();
    if (sortedArray[index].length == 0) {
        sortedArray.splice(index, 1);
        index %= sortedArray.length;
    } else {
        index = (index + 1) % sortedArray.length
    }
}
