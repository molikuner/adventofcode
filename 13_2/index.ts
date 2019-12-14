const readlineSync = require('readline-sync');
const readline = require('readline');


interface Array<T> {
    flatMap<R>(block: (T) => Array<R>): Array<R>

    removed(item: T): Array<T>

    count(predicate: (it: T, index: number, array: Array<T>) => boolean): bigint
}

Array.prototype.flatMap = function flatMap<T, R>(this: Array<T>, block: (T) => Array<R>): Array<R> {
    let result: Array<R> = [];
    for (let a of this) result = result.concat(block(a));
    return result;
};
Array.prototype.removed = function removed<T>(this: Array<T>, item: T): Array<T> {
    const index = this.indexOf(item);
    const result = [].concat(this);
    if (index != -1) result.splice(index, 1);
    return result

};
Array.prototype.count = function count<T>(this: Array<T>, predicate: (it: T, index: number, array: Array<T>) => boolean): bigint {
    let count = 0n;
    this.forEach((value, index, array) => {
        if (predicate(value, index, array)) count++;
    });
    return count;
};

type Pointer = number

type ComputerValueType = bigint
type Output = Array<bigint>
type Input = Array<bigint>

class ExecutionResult {
    constructor(readonly finishedWithHalt: true | Pointer, readonly memory: ComputerMemory, readonly output: Output) {
    }
}

class ComputerMemory extends Array<ComputerValueType> {
    private relativeBase: bigint = 0n;

    constructor(...items: Array<ComputerValueType | number>) {
        super(...items.map(it => BigInt(it)));
        Object.setPrototypeOf(this, ComputerMemory.prototype);
    }

    setRelativeBase(base: bigint): ComputerMemory {
        this.relativeBase = base;
        return this
    }

    concat(...items: Array<Array<ComputerValueType>>): ComputerMemory {
        return Object.setPrototypeOf(super.concat(...items), ComputerMemory.prototype);
    }

    private getValue(pointer: Pointer | ComputerValueType): ComputerValueType {
        if (this[Number(pointer)] === undefined) return 0n;
        return this[Number(pointer)];
    }

    private instruction(pointer: Pointer): ComputerValueType {
        return BigInt(this.getValue(pointer).toString().split("").slice(-2).join(""));
    }

    private instructionArgumentModes(pointer: Pointer, amountArgs: bigint): Array<ComputerValueType> {
        const instructionModes = this.getValue(pointer).toString().split("").slice(0, -2).map(it => BigInt(it));
        return new Array(Number(amountArgs) - instructionModes.length).fill(0n).concat(instructionModes).reverse();
    }

    private argumentWithMode(argumentPointer: Pointer, mode: ComputerValueType): ComputerValueType {
        //console.log("getting argument for ptr:", argumentPointer, ", with mode", mode, /*"from", this, */"as pointer:", this.getValue(this.getValue(argumentPointer)), ", as value:", this.getValue(argumentPointer), ", as shifting:", this.getValue(this.relativeBase + this.getValue(argumentPointer)));
        switch (mode) {
            case 0n:
                return this.getValue(this.getValue(argumentPointer));
            case 1n:
                return this.getValue(argumentPointer);
            case 2n:
                //console.log("getting argument value with relative base", this.relativeBase, "at position", argumentPointer, "is", this.getValue(this.relativeBase + this.getValue(argumentPointer)));
                return this.getValue(this.relativeBase + this.getValue(argumentPointer));
            default:
                throw new Error(`Illegal argument mode for argument at pos ${argumentPointer} is ${mode}`);
        }
    }

    private saveTo(location: Pointer | ComputerValueType, value: ComputerValueType, mode: ComputerValueType) {
        switch (mode) {
            case 0n:
                this[Number(this[Number(location)])] = value;
                //console.log("saved", value, "to", this[Number(location)], "is", this[Number(this[Number(location)])]);
                break;
            case 2n:
                this[Number(this.relativeBase + this[Number(location)])] = value;
                //console.log("saved", value, "to", this.relativeBase + this[Number(location)], "is", this[Number(this.relativeBase + BigInt(location))]);
                break;
            default:
                throw new Error(`Illegal save mode for location ${location} is ${mode}. Should have saved ${value}`);
        }
    }

    runComputer(initialInput: Input = [], waitOnInput: boolean = false, inPlace: false | Pointer = false): ExecutionResult {
        const computeMemory: ComputerMemory = (inPlace !== false) ? this : new ComputerMemory(...this).setRelativeBase(this.relativeBase);
        const input: Input = [].concat(initialInput);
        const outputs: Output = [];
        for (let pointer: Pointer = (inPlace !== false) ? inPlace : 0, memLength = computeMemory.length; pointer < memLength;) {
            const currentInstruction = computeMemory.instruction(pointer);
            //console.log("*", pointer, computeMemory, currentInstruction, computeMemory[pointer], computeMemory.instructionArgumentModes(pointer, 4n), computeMemory[100], computeMemory[101]);
            switch (currentInstruction) {
                case 1n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 3n);
                    //console.log("times", pointer, computeMemory[pointer], modes, "saving to", computeMemory[pointer + 3]);
                    computeMemory.saveTo(
                        pointer + 3,
                        computeMemory.argumentWithMode(pointer + 1, modes[0])
                        +
                        computeMemory.argumentWithMode(pointer + 2, modes[1]),
                        modes[2]
                    );
                    pointer += 4;
                    break;
                }
                case 2n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 3n);
                    //console.log("times", pointer, computeMemory[pointer], modes, "saving to", computeMemory[pointer + 3]);
                    computeMemory.saveTo(
                        pointer + 3,
                        computeMemory.argumentWithMode(pointer + 1, modes[0])
                        *
                        computeMemory.argumentWithMode(pointer + 2, modes[1]),
                        modes[2]
                    );
                    pointer += 4;
                    break;
                }
                case 3n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 1n);
                    //console.log("read", pointer, computeMemory[pointer], modes, "saving to", computeMemory[pointer + 1], ", possible input:", input[0]);
                    let readIn;
                    if (input[0] !== undefined) {
                        //console.log(`At instruction ${pointer} need input, which will be get from storage. (${input[0]})`);
                        readIn = input.splice(0, 1)[0];
                    } else if (waitOnInput) {
                        //console.log(`At instruction ${pointer} need input, pausing computer.`);
                        return new ExecutionResult(pointer, computeMemory, outputs);
                    } else {
                        readIn = BigInt(readlineSync.question(`At instruction ${pointer} we need a input: `));
                    }
                    computeMemory.saveTo(pointer + 1, readIn, modes[0]);
                    pointer += 2;
                    break;
                }
                case 4n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 1n);
                    //console.log("print", pointer, computeMemory[pointer], computeMemory[pointer + 1], modes);
                    const out = computeMemory.argumentWithMode(pointer + 1, modes[0]);
                    outputs.push(out);
                    //console.log(`At instruction ${pointer} with relativeBase ${computeMemory.relativeBase} got: ${out}`);
                    pointer += 2;
                    break;
                }
                case 5n:
                case 6n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 2n);
                    //console.log("jump-if-true/false", currentInstruction, computeMemory.argumentWithMode(pointer + 1, modes[0]), pointer, computeMemory[pointer], computeMemory[pointer + 1], modes, computeMemory.argumentWithMode(pointer + 2, modes[1]));
                    if (Boolean(computeMemory.argumentWithMode(pointer + 1, modes[0])) === Boolean(6n - currentInstruction)) {
                        pointer = Number(computeMemory.argumentWithMode(pointer + 2, modes[1]));
                        //console.log("jumping to", pointer);
                    } else {
                        pointer += 3;
                    }
                    break;
                }
                case 7n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 3n);
                    //console.log("less than", pointer, computeMemory[pointer], computeMemory[pointer + 1], modes, computeMemory[pointer + 3], computeMemory.argumentWithMode(pointer + 3, modes[2]));
                    computeMemory.saveTo(pointer + 3,
                        BigInt(
                            computeMemory.argumentWithMode(pointer + 1, modes[0])
                            <
                            computeMemory.argumentWithMode(pointer + 2, modes[1])
                        ),
                        modes[2]
                    );
                    pointer += 4;
                    break;
                }
                case 8n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 3n);
                    //console.log("equals", pointer, computeMemory[pointer], computeMemory[pointer + 1], modes, computeMemory[pointer + 3], computeMemory.argumentWithMode(pointer + 3, modes[2]));//, BigInt(argumentWithMode(pointer + 1, modes[0], computeMemory) == argumentWithMode(pointer + 2, modes[1], computeMemory)), argumentWithMode(pointer + 3, modes[0], computeMemory));
                    computeMemory.saveTo(pointer + 3,
                        BigInt(
                            computeMemory.argumentWithMode(pointer + 1, modes[0])
                            ==
                            computeMemory.argumentWithMode(pointer + 2, modes[1])
                        ),
                        modes[2]
                    );
                    pointer += 4;
                    break;
                }
                case 9n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 1n);
                    //const prev = computeMemory.relativeBase;
                    computeMemory.relativeBase += computeMemory.argumentWithMode(pointer + 1, modes[0]);
                    //console.log(pointer, computeMemory[pointer + 1], modes[0], "increased relative base from", prev, "to", computeMemory.relativeBase);
                    pointer += 2;
                    break;
                }
                case 99n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 0n);
                    pointer = computeMemory.length;
                    break;
                }
                default:
                    throw new Error("Unknown opcode " + computeMemory[pointer] + " at pointer " + pointer);
            }
        }
        return new ExecutionResult(true, computeMemory, outputs);
    }

    async steamComputer(initialInput: Input = [], handleInputRequest: (executionResult: ExecutionResult) => Promise<Input>): Promise<ExecutionResult> {
        let currentState = this.runComputer(initialInput, true, 0);
        while (currentState.finishedWithHalt !== true) {
            const readIn = await handleInputRequest(currentState);
            currentState = this.runComputer(readIn, true, currentState.finishedWithHalt);
        }
        return Promise.resolve(currentState);
    }
}

class Coordinate {
    constructor(readonly x: bigint, readonly y: bigint) {
    }
}
enum TileID {
    Empty, Wall, Block, HorizontalPaddle, Ball
}

function tileAsString(tile: TileID): string {
    switch (tile) {
        case TileID.Empty: return ' ';
        case TileID.Wall: return '#';
        case TileID.Block: return '+';
        case TileID.HorizontalPaddle: return '―';
        case TileID.Ball: return '*';
        default: return '@';
    }
}

type BitMap = Map<bigint, Map<bigint, TileID>>;

class Painting {
    private bitMap: BitMap = new Map<bigint, Map<bigint, TileID>>();
    private score: bigint = 0n;
    private live: boolean = false;

    paint(coordinate: Coordinate, color: TileID): this {
        const yMap = this.bitMap.get(coordinate.x) || new Map<bigint, TileID>();
        yMap.set(coordinate.y, color);
        this.bitMap.set(coordinate.x, yMap);
        return this;
    }

    getBlock(coordinate: Coordinate): TileID {
        const yMap = this.bitMap.get(coordinate.x) || new Map<bigint, TileID>();
        return yMap.get(coordinate.y) || TileID.Empty;
    }

    countColors(specificColor: TileID | null = TileID.Block): bigint {
        let count = 0n;
        this.bitMap.forEach(value => {
            value.forEach(tile => {
                if (specificColor === null || tile === specificColor) {
                    count++;
                }
            })
        });
        return count;
    }

    print() {
        let lowestY: bigint = 0n;
        let highestY: bigint = 0n;
        let lowestX: bigint = 0n;
        let highestX: bigint = 0n;

        this.bitMap.forEach((value, x) => {
            value.forEach((_, y) => {
                if (y < lowestY) lowestY = y;
                if (y > highestY) highestY = y;
            });
            if (x < lowestX) lowestX = x;
            if (x > highestX) highestX = x;
        });

        for (let y = lowestY; y <= highestY; y++) {
            for (let x = lowestX; x <= highestX; x++) {
                process.stdout.write(tileAsString(this.getBlock(new Coordinate(x, y))));
            }
            process.stdout.write('\n');
        }

        process.stdout.write(`SCORE: ${this.score}\n`);
    }

    setLive(live: boolean): Painting {
        this.live = live;
        if (live) readline.clearScreenDown(process.stdout);
        return this;
    }

    setScore(score: bigint) {
        this.score = score;
    }

    get getScore(): bigint {
        return this.score;
    }

    updatePainting(output: Output, cb: (coordinate: Coordinate, tile: TileID) => void = () => {}) {
        for (let i = 0; i < output.length - 2; i += 3) {
            if (output[i] === -1n && output[i + 1] === 0n) {
                this.setScore(output[i + 2]);
            } else {
                const coordinate = new Coordinate(output[i], output[i + 1]);
                const tile: TileID = Number(output[i + 2]);
                this.paint(coordinate, tile);
                cb(coordinate, tile)
            }
        }
    }

    updatePaintingLive(output: Output) {
        if (!this.live) return this.updatePainting(output);
        else this.updatePainting(output, (coordinate, tile) => {
            readline.cursorTo(process.stdout, Number(coordinate.x), Number(coordinate.y));
            process.stdout.write(tileAsString(tile));
        });
        readline.cursorTo(process.stdout, 0, 0);
        process.stdout.write(`SCORE: ${this.score}`);
        readline.cursorTo(process.stdout, 0, 0);
    }
}

const arcadeProgram = new ComputerMemory(2,380,379,385,1008,2571,363613,381,1005,381,12,99,109,2572,1101,0,0,383,1102,1,0,382,20102,1,382,1,21002,383,1,2,21102,1,37,0,1106,0,578,4,382,4,383,204,1,1001,382,1,382,1007,382,42,381,1005,381,22,1001,383,1,383,1007,383,23,381,1005,381,18,1006,385,69,99,104,-1,104,0,4,386,3,384,1007,384,0,381,1005,381,94,107,0,384,381,1005,381,108,1106,0,161,107,1,392,381,1006,381,161,1102,1,-1,384,1105,1,119,1007,392,40,381,1006,381,161,1102,1,1,384,21001,392,0,1,21102,21,1,2,21101,0,0,3,21101,0,138,0,1105,1,549,1,392,384,392,20102,1,392,1,21101,0,21,2,21102,3,1,3,21101,0,161,0,1105,1,549,1102,0,1,384,20001,388,390,1,20102,1,389,2,21102,180,1,0,1106,0,578,1206,1,213,1208,1,2,381,1006,381,205,20001,388,390,1,21001,389,0,2,21102,1,205,0,1106,0,393,1002,390,-1,390,1101,0,1,384,21001,388,0,1,20001,389,391,2,21102,1,228,0,1106,0,578,1206,1,261,1208,1,2,381,1006,381,253,20101,0,388,1,20001,389,391,2,21101,253,0,0,1105,1,393,1002,391,-1,391,1101,1,0,384,1005,384,161,20001,388,390,1,20001,389,391,2,21101,0,279,0,1105,1,578,1206,1,316,1208,1,2,381,1006,381,304,20001,388,390,1,20001,389,391,2,21102,1,304,0,1106,0,393,1002,390,-1,390,1002,391,-1,391,1102,1,1,384,1005,384,161,20101,0,388,1,21002,389,1,2,21102,0,1,3,21101,0,338,0,1106,0,549,1,388,390,388,1,389,391,389,20102,1,388,1,21002,389,1,2,21102,4,1,3,21101,0,365,0,1105,1,549,1007,389,22,381,1005,381,75,104,-1,104,0,104,0,99,0,1,0,0,0,0,0,0,277,19,18,1,1,21,109,3,22101,0,-2,1,22102,1,-1,2,21101,0,0,3,21102,1,414,0,1106,0,549,22101,0,-2,1,22102,1,-1,2,21102,429,1,0,1106,0,601,2101,0,1,435,1,386,0,386,104,-1,104,0,4,386,1001,387,-1,387,1005,387,451,99,109,-3,2106,0,0,109,8,22202,-7,-6,-3,22201,-3,-5,-3,21202,-4,64,-2,2207,-3,-2,381,1005,381,492,21202,-2,-1,-1,22201,-3,-1,-3,2207,-3,-2,381,1006,381,481,21202,-4,8,-2,2207,-3,-2,381,1005,381,518,21202,-2,-1,-1,22201,-3,-1,-3,2207,-3,-2,381,1006,381,507,2207,-3,-4,381,1005,381,540,21202,-4,-1,-1,22201,-3,-1,-3,2207,-3,-4,381,1006,381,529,21202,-3,1,-7,109,-8,2106,0,0,109,4,1202,-2,42,566,201,-3,566,566,101,639,566,566,2101,0,-1,0,204,-3,204,-2,204,-1,109,-4,2105,1,0,109,3,1202,-1,42,593,201,-2,593,593,101,639,593,593,21002,0,1,-2,109,-3,2106,0,0,109,3,22102,23,-2,1,22201,1,-1,1,21102,1,487,2,21101,0,628,3,21102,966,1,4,21101,630,0,0,1105,1,456,21201,1,1605,-2,109,-3,2105,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,2,0,0,0,2,0,0,0,2,0,2,2,0,0,0,2,2,0,2,0,0,0,0,2,0,2,2,2,0,2,0,0,2,2,0,0,0,1,1,0,2,0,2,2,2,2,0,2,2,0,0,2,0,0,0,0,2,0,0,0,2,0,0,2,0,2,2,0,0,2,2,2,2,0,2,2,0,2,0,1,1,0,2,0,0,0,0,0,0,2,2,0,2,0,0,2,0,2,2,2,2,2,2,0,0,0,0,0,0,2,0,2,0,2,2,0,0,2,2,2,0,1,1,0,0,0,0,2,0,0,0,0,0,2,2,0,0,2,2,0,2,2,2,2,2,2,0,0,2,0,2,2,2,2,0,0,0,2,2,0,0,2,0,1,1,0,2,2,2,0,0,2,0,0,2,0,2,0,0,0,0,0,2,2,2,0,0,0,2,2,0,2,2,0,0,2,0,0,2,0,2,2,2,0,0,1,1,0,0,2,0,0,0,2,0,2,2,2,2,2,2,0,2,2,2,2,2,0,0,0,0,2,0,0,0,0,0,0,2,2,0,0,0,2,0,2,0,1,1,0,2,0,2,0,2,2,2,2,2,2,2,0,0,2,2,2,0,0,2,2,2,2,0,0,2,0,2,2,0,0,2,0,0,0,0,2,2,2,0,1,1,0,0,2,0,2,2,0,2,0,0,2,0,0,2,0,0,2,2,2,2,0,2,0,2,0,2,2,2,2,2,0,2,2,0,0,0,0,2,0,0,1,1,0,2,0,0,0,0,2,0,0,0,0,0,0,2,2,0,2,2,0,2,2,0,0,2,0,2,0,0,2,2,0,2,0,0,0,0,0,2,2,0,1,1,0,0,2,2,2,2,2,0,0,0,2,0,0,0,0,0,2,2,0,2,0,0,0,2,0,2,0,0,0,2,0,0,2,0,0,2,0,0,2,0,1,1,0,2,2,2,0,0,2,0,2,2,0,0,2,2,2,0,2,0,2,2,2,0,0,0,0,2,2,0,2,0,2,2,2,0,0,2,0,0,0,0,1,1,0,2,2,2,0,0,0,2,0,0,2,0,0,0,2,2,0,0,2,0,0,0,2,0,0,0,2,2,0,0,0,2,0,0,0,0,2,2,2,0,1,1,0,0,0,0,0,2,0,2,2,0,0,2,2,2,2,0,2,0,2,0,2,2,2,0,0,0,2,2,0,0,2,2,0,2,2,0,2,0,0,0,1,1,0,2,0,0,2,0,2,0,2,0,0,2,0,2,0,2,0,0,0,0,0,0,2,0,2,2,2,0,2,2,0,0,0,2,0,2,2,2,2,0,1,1,0,2,2,2,2,2,0,2,0,0,0,2,0,0,2,2,2,0,2,0,2,0,2,2,2,0,2,2,2,2,2,2,0,0,0,2,2,2,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,32,53,76,11,85,11,33,25,77,17,98,11,57,72,6,86,78,45,18,6,83,80,79,97,92,26,83,24,93,41,94,35,21,98,87,53,65,95,81,11,12,61,28,63,67,79,64,50,11,59,48,72,61,19,61,84,20,3,66,4,11,97,25,15,70,72,35,4,83,54,56,90,49,90,92,54,33,25,4,17,83,25,80,11,41,68,11,56,28,1,6,76,29,30,30,53,51,19,86,72,56,54,15,69,78,72,86,2,16,39,87,78,38,66,29,7,62,38,41,49,6,36,11,66,16,80,73,39,31,1,41,2,34,88,62,20,14,64,86,12,48,78,65,61,34,78,76,29,58,5,97,97,58,61,71,48,28,95,93,4,5,3,90,64,27,96,85,59,91,69,92,54,47,7,78,93,98,16,8,53,78,83,24,53,78,73,66,21,49,98,92,60,36,96,45,38,6,52,26,56,8,79,15,35,86,51,39,71,61,27,82,15,89,58,19,21,23,49,22,33,36,11,29,52,62,77,26,3,90,10,14,78,84,81,80,98,16,92,80,97,44,42,48,85,93,54,74,64,75,72,32,71,13,51,90,34,94,77,14,8,5,87,59,51,92,31,16,13,28,67,36,7,31,42,10,34,24,79,51,77,79,11,63,47,2,76,95,5,65,40,47,37,4,66,26,97,68,55,43,57,18,48,21,37,25,37,50,10,74,92,1,93,56,95,91,50,33,92,7,23,44,4,11,31,67,44,68,79,25,21,4,88,33,89,64,28,4,38,97,34,9,43,98,82,50,2,73,22,7,60,8,41,24,29,55,70,75,94,80,84,55,13,18,46,39,82,64,92,39,61,79,54,49,70,49,47,27,62,15,89,92,59,35,20,71,92,5,22,42,15,49,64,90,16,77,67,17,86,10,96,40,4,3,44,93,55,58,41,70,85,76,69,90,40,33,21,34,47,98,44,51,3,21,47,61,41,33,57,33,30,4,36,75,70,26,8,51,18,4,64,84,3,54,29,73,5,8,46,40,45,25,88,51,7,93,7,96,56,8,77,61,40,52,77,71,65,63,41,79,57,81,27,5,60,60,2,16,16,52,6,59,12,31,12,61,70,59,29,34,76,9,76,11,12,14,33,79,55,57,1,12,72,71,15,85,54,92,28,28,73,39,14,34,68,37,71,45,41,47,47,65,31,9,80,22,84,53,61,13,14,28,80,26,37,44,36,77,41,88,73,78,52,36,77,86,50,68,71,63,88,25,88,23,19,83,9,9,56,77,52,54,24,88,3,5,33,49,56,73,75,27,10,45,20,5,30,88,61,21,74,2,52,96,36,61,27,97,28,35,32,3,64,89,6,61,63,90,33,12,90,29,16,13,94,17,51,94,59,55,95,92,72,51,62,10,42,10,83,34,55,51,65,50,23,53,70,74,83,62,84,12,74,9,54,75,45,5,76,30,61,92,87,58,48,21,41,13,60,2,10,95,23,26,51,37,71,23,20,74,12,30,24,60,71,98,46,93,36,34,61,7,62,24,44,64,27,86,45,75,40,47,80,92,91,84,36,12,34,45,18,9,30,90,33,48,63,95,34,92,46,85,17,90,9,66,40,74,57,17,35,62,74,76,8,4,26,49,79,82,20,67,51,53,57,63,25,11,89,96,56,98,2,72,58,23,17,44,70,51,91,13,78,46,40,73,74,94,10,92,98,29,84,50,17,81,32,15,50,64,6,12,8,76,50,17,31,60,35,41,81,90,94,81,56,67,27,9,89,87,15,36,75,46,46,22,59,54,71,78,41,57,54,8,63,24,74,56,75,20,62,28,16,1,10,91,40,68,72,25,60,3,37,49,33,37,19,68,43,25,94,91,24,4,76,39,25,32,95,70,14,53,70,23,28,72,63,40,6,69,67,13,69,49,95,92,40,88,49,51,96,22,90,62,43,23,69,37,19,42,38,52,52,32,12,31,5,94,94,67,23,22,3,25,77,66,58,59,46,1,2,63,39,54,27,17,65,53,74,6,22,20,34,81,64,53,81,91,80,84,24,43,5,40,13,48,64,42,13,72,72,47,30,69,1,31,13,49,70,59,77,21,75,15,29,12,25,98,85,5,47,70,37,68,15,20,65,68,24,77,74,35,59,3,26,67,62,81,95,8,16,71,45,62,82,2,9,30,5,22,62,67,47,3,68,71,73,363613);

/* run the computer as interactive game
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
        process.exit(130);
    }
});
const painting = new Painting().setLive(true);
arcadeProgram.steamComputer([], async (executionResult: ExecutionResult) => {
    painting.updatePaintingLive(executionResult.output);
    const readIn = new Promise<string>(resolve => {
        setTimeout(() => resolve(undefined), 2000);
        process.stdin.once('keypress', str => {
            process.stdout.write('!');
            resolve(str);
        });
    });
    // always take 1 second to process possible input
    //await new Promise((res) => setTimeout(() => res(), 2000));
    switch (await readIn) {
        case 'a': return Promise.resolve([-1n]);
        case 'd': return Promise.resolve([1n]);
        default: return Promise.resolve([0n]);
    }
}).then(it => {
    readline.clearScreenDown(process.stdout);
    console.log('finished execution with', it);
    //painting.print();
    painting.updatePainting(it.output);
    painting.print();
    process.exit(0);
});
*/

let p: Pointer = 0;
// returns [program ended normal, score, ball-x, paddleX]
function runGame(input: Input): [boolean, bigint, bigint, bigint] {
    const result = arcadeProgram.runComputer(input, true, p);

    let score = 0n;
    let ballX = 0n;
    let paddleX = 0n;

    for (let i = 0; i < result.output.length - 2; i += 3) {
        if (result.output[i] === -1n) {
            score = result.output[i + 2];
        } else if (Number(result.output[i + 2]) === TileID.Ball) {
            ballX = result.output[i];
        } else if (Number(result.output[i + 2]) === TileID.HorizontalPaddle) {
            paddleX = result.output[i];
        }
    }

    if (input.length % 200 === 0) {
        const painting = new Painting();
        painting.updatePainting(result.output);
        painting.print();
    }

    if (result.finishedWithHalt !== true) p = result.finishedWithHalt;
    return [result.finishedWithHalt === true, score, ballX, paddleX];
}

function findSolution(): bigint {
    let endOfRecursion: boolean;
    let ballX = 1n;
    let paddleX = 0n;
    let score: bigint;
    do {
        let move = ballX - paddleX;
        if (move < -1) move = -1n;
        if (move > 1) move = 1n;
        [endOfRecursion, score, ballX, paddleX] = runGame([move]);
    } while (!endOfRecursion);
    return score;
}

console.log(findSolution());
