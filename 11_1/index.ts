const readline = require('readline-sync');

interface Array<T> {
    flatMap<R>(block: (T) => Array<R>): Array<R>

    removed(item: T): Array<T>
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

type Pointer = number

type ComputerValueType = bigint
type Output = Array<bigint>
type Input = Array<bigint>
type ColorWhite = boolean;

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

    runComputer(input: Input = [], waitOnInput: boolean = false, inPlace: false | Pointer = false): ExecutionResult {
        const computeMemory: ComputerMemory = (inPlace !== false) ? this : new ComputerMemory(...this).setRelativeBase(this.relativeBase);
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
                        console.log(`At instruction ${pointer} need input, which will be get from storage. (${input[0]})`);
                        readIn = input.splice(0, 1)[0];
                    } else if (waitOnInput) {
                        console.log(`At instruction ${pointer} need input, pausing computer.`);
                        return new ExecutionResult(pointer, computeMemory, outputs);
                    } else {
                        readIn = BigInt(readline.question(`At instruction ${pointer} we need a input: `));
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
                    console.log(`At instruction ${pointer} with relativeBase ${computeMemory.relativeBase} got: ${out}`);
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
}

const robotMemory: ComputerMemory = new ComputerMemory(3, 8, 1005, 8, 352, 1106, 0, 11, 0, 0, 0, 104, 1, 104, 0, 3, 8, 102, -1, 8, 10, 101, 1, 10, 10, 4, 10, 108, 1, 8, 10, 4, 10, 102, 1, 8, 28, 1, 1003, 20, 10, 2, 106, 11, 10, 2, 1107, 1, 10, 1, 1001, 14, 10, 3, 8, 1002, 8, -1, 10, 1001, 10, 1, 10, 4, 10, 1008, 8, 0, 10, 4, 10, 1002, 8, 1, 67, 2, 1009, 7, 10, 3, 8, 1002, 8, -1, 10, 1001, 10, 1, 10, 4, 10, 108, 0, 8, 10, 4, 10, 101, 0, 8, 92, 1, 105, 9, 10, 1006, 0, 89, 1, 108, 9, 10, 3, 8, 1002, 8, -1, 10, 1001, 10, 1, 10, 4, 10, 1008, 8, 1, 10, 4, 10, 1002, 8, 1, 126, 1, 1101, 14, 10, 1, 1005, 3, 10, 1006, 0, 29, 1006, 0, 91, 3, 8, 102, -1, 8, 10, 101, 1, 10, 10, 4, 10, 108, 1, 8, 10, 4, 10, 1002, 8, 1, 161, 1, 1, 6, 10, 1006, 0, 65, 2, 106, 13, 10, 1006, 0, 36, 3, 8, 1002, 8, -1, 10, 1001, 10, 1, 10, 4, 10, 1008, 8, 1, 10, 4, 10, 102, 1, 8, 198, 1, 105, 15, 10, 1, 1004, 0, 10, 3, 8, 1002, 8, -1, 10, 1001, 10, 1, 10, 4, 10, 1008, 8, 0, 10, 4, 10, 101, 0, 8, 228, 2, 1006, 8, 10, 2, 1001, 16, 10, 3, 8, 102, -1, 8, 10, 1001, 10, 1, 10, 4, 10, 108, 0, 8, 10, 4, 10, 1001, 8, 0, 257, 1006, 0, 19, 2, 6, 10, 10, 2, 4, 13, 10, 2, 1002, 4, 10, 3, 8, 102, -1, 8, 10, 1001, 10, 1, 10, 4, 10, 1008, 8, 1, 10, 4, 10, 1002, 8, 1, 295, 3, 8, 1002, 8, -1, 10, 101, 1, 10, 10, 4, 10, 108, 0, 8, 10, 4, 10, 101, 0, 8, 316, 2, 101, 6, 10, 1006, 0, 84, 2, 1004, 13, 10, 1, 1109, 3, 10, 101, 1, 9, 9, 1007, 9, 1046, 10, 1005, 10, 15, 99, 109, 674, 104, 0, 104, 1, 21101, 387365315340, 0, 1, 21102, 369, 1, 0, 1105, 1, 473, 21101, 666685514536, 0, 1, 21102, 380, 1, 0, 1106, 0, 473, 3, 10, 104, 0, 104, 1, 3, 10, 104, 0, 104, 0, 3, 10, 104, 0, 104, 1, 3, 10, 104, 0, 104, 1, 3, 10, 104, 0, 104, 0, 3, 10, 104, 0, 104, 1, 21102, 1, 46266346536, 1, 21102, 427, 1, 0, 1105, 1, 473, 21101, 235152829659, 0, 1, 21101, 438, 0, 0, 1105, 1, 473, 3, 10, 104, 0, 104, 0, 3, 10, 104, 0, 104, 0, 21102, 838337188620, 1, 1, 21101, 461, 0, 0, 1105, 1, 473, 21102, 988753429268, 1, 1, 21102, 1, 472, 0, 1106, 0, 473, 99, 109, 2, 22101, 0, -1, 1, 21101, 40, 0, 2, 21101, 504, 0, 3, 21102, 494, 1, 0, 1106, 0, 537, 109, -2, 2105, 1, 0, 0, 1, 0, 0, 1, 109, 2, 3, 10, 204, -1, 1001, 499, 500, 515, 4, 0, 1001, 499, 1, 499, 108, 4, 499, 10, 1006, 10, 531, 1101, 0, 0, 499, 109, -2, 2106, 0, 0, 0, 109, 4, 2101, 0, -1, 536, 1207, -3, 0, 10, 1006, 10, 554, 21102, 1, 0, -3, 21202, -3, 1, 1, 21201, -2, 0, 2, 21102, 1, 1, 3, 21101, 573, 0, 0, 1105, 1, 578, 109, -4, 2105, 1, 0, 109, 5, 1207, -3, 1, 10, 1006, 10, 601, 2207, -4, -2, 10, 1006, 10, 601, 21201, -4, 0, -4, 1105, 1, 669, 22101, 0, -4, 1, 21201, -3, -1, 2, 21202, -2, 2, 3, 21101, 620, 0, 0, 1106, 0, 578, 22102, 1, 1, -4, 21101, 0, 1, -1, 2207, -4, -2, 10, 1006, 10, 639, 21101, 0, 0, -1, 22202, -2, -1, -2, 2107, 0, -3, 10, 1006, 10, 661, 22101, 0, -1, 1, 21102, 661, 1, 0, 106, 0, 536, 21202, -2, -1, -2, 22201, -4, -2, -4, 109, -5, 2106, 0, 0);

class Coordinate {
    constructor(readonly x: bigint, readonly y: bigint) {
    }

    move(direction: RobotDirection): Coordinate {
        switch (direction) {
            case RobotDirection.UP:
                return new Coordinate(this.x, this.y + 1n);
            case RobotDirection.LEFT:
                return new Coordinate(this.x - 1n, this.y);
            case RobotDirection.DOWN:
                return new Coordinate(this.x, this.y - 1n);
            case RobotDirection.RIGHT:
                return new Coordinate(this.x + 1n, this.y);
        }
    }
}

type BitMap = Map<bigint, Map<bigint, ColorWhite>>;

class Painting {
    private bitMap: BitMap = new Map<bigint, Map<bigint, ColorWhite>>();

    paint(coordinate: Coordinate, color: ColorWhite): this {
        const yMap = this.bitMap.get(coordinate.x) || new Map<bigint, ColorWhite>();
        yMap.set(coordinate.y, color);
        this.bitMap.set(coordinate.x, yMap);
        return this;
    }

    getColor(coordinate: Coordinate): ColorWhite {
        const yMap = this.bitMap.get(coordinate.x) || new Map<bigint, ColorWhite>();
        return yMap.get(coordinate.y) || false;
    }

    countColoredPixels(): bigint {
        let count = 0;
        this.bitMap.forEach(value => {
            count += value.size;
        });
        return BigInt(count);
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

        for (let y = highestY; y >= lowestY; y--) {
            for (let x = lowestX; x <= highestX; x++) {
                process.stdout.write(this.getColor(new Coordinate(x, y)) ? "#" : " ");
            }
            process.stdout.write('\n');
        }
    }
}

enum RobotDirection {
    UP, LEFT, DOWN, RIGHT
}

function updateRobotDirection(old: RobotDirection, output: ComputerValueType): RobotDirection {
    switch (old) {
        case RobotDirection.UP:
            return (output) ? RobotDirection.RIGHT : RobotDirection.LEFT;
        case RobotDirection.LEFT:
            return (output) ? RobotDirection.UP : RobotDirection.DOWN;
        case RobotDirection.DOWN:
            return (output) ? RobotDirection.LEFT : RobotDirection.RIGHT;
        case RobotDirection.RIGHT:
            return (output) ? RobotDirection.DOWN : RobotDirection.UP;
    }
}

class PaintingHead {
    constructor(readonly position: Coordinate, readonly direction: RobotDirection) {
    }

    updated(outputValue: ComputerValueType): PaintingHead {
        const newDirection = updateRobotDirection(this.direction, outputValue);
        //console.log('moved from', this.position, 'to', this.position.move(newDirection), 'with', newDirection);
        return new PaintingHead(
            this.position.move(newDirection),
            newDirection
        );
    }
}

class PainterRobot {
    constructor(readonly memory: ComputerMemory) {
    }

    run(): Painting {
        let executionResult: ExecutionResult = null;
        let paintingHead = new PaintingHead(new Coordinate(0n, 0n), RobotDirection.UP);
        let painting: Painting = new Painting();
        do {
            executionResult = this.memory.runComputer([BigInt(painting.getColor(paintingHead.position))], true,
                //                          executionResult.finishedWithHalt !== true shouldn't be needed, but compiler...
                (executionResult && executionResult.finishedWithHalt !== true) ? executionResult.finishedWithHalt : 0
            );
            [paintingHead, painting] = PainterRobot.completePaintingFormComputerOutput(painting, paintingHead, executionResult.output);
        } while (executionResult.finishedWithHalt !== true);
        return painting;
    }

    private static completePaintingFormComputerOutput(painting: Painting, paintingHead: PaintingHead, output: Output): [PaintingHead, Painting] {
        const lastCoordinate = PainterRobot.streamOutputColors(output, paintingHead, (c, color) => {
            //console.log("computer was at", c, 'and painted', color);
            painting.paint(c, color);
        });
        return [lastCoordinate, painting];
    }

    private static streamOutputColors(output: Output, initHeadState: PaintingHead, consumer: (c: Coordinate, color: ColorWhite) => void): PaintingHead {
        let headState = initHeadState;
        for (let i = 0; i < output.length - 1; i += 2) {
            consumer(headState.position, Boolean(output[i]));
            headState = headState.updated(output[i + 1]);
        }
        //consumer(currentCoordinate, Boolean(output[output.length - 2]));
        return headState;
    }
}

const painting = new PainterRobot(robotMemory).run();
console.log(painting.countColoredPixels());
