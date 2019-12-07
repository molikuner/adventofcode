const readline = require('readline-sync');
class Pair<A, B> {
    constructor(readonly first: A, readonly second: B) {
    }
}
interface Array<T> {
    flatMap<R>(block: (T) => Array<R>): Array<R>

    removed(item: T): Array<T>

    permute(): Array<Array<T>>
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
Array.prototype.permute = function permute<T>(this: Array<T>): Array<Array<T>> {
    if (this.length == 0) return [[]];
    return this.flatMap<Array<T>>(curr => this.removed(curr).permute().map<Array<T>>(it => [curr].concat(it)))
};

type Pointer = number

type ComputerValueType = bigint
type Output = Array<bigint>
type Input = Array<bigint>

class ComputerMemory extends Array<ComputerValueType> {
    constructor(...items: Array<ComputerValueType|number>) {
        super(...items.map(it => BigInt(it)));
        Object.setPrototypeOf(this, ComputerMemory.prototype);
    }

    concat(...items: Array<Array<ComputerValueType>>): ComputerMemory {
        return Object.setPrototypeOf(super.concat(...items), ComputerMemory.prototype);
    }

    private instruction(pointer: Pointer): bigint {
        return BigInt(this[pointer].toString().split("").slice(-2).join(""));
    }

    private instructionArgumentModes(pointer: Pointer, amountArgs: bigint): Array<bigint> {
        if (this[pointer] === undefined) this[pointer] = 0n;
        const instructionModes = this[pointer].toString().split("").slice(0, -2).map(it => BigInt(it));
        return new Array(Number(amountArgs) - instructionModes.length).fill(0n).concat(instructionModes).reverse();
    }

    private argumentWithMode(argumentPointer: number, mode: bigint): bigint {
        //console.log("getting argument for ptr:", argumentPointer, ", with mode", mode, "from", memory, "as pointer:", memory[Number(memory[argumentPointer])], ", as value:", memory[argumentPointer]);
        switch (BigInt(mode)) {
            case 0n:
                return this[Number(this[argumentPointer])];
            case 1n:
                return this[argumentPointer];
            default:
                throw new Error(`Illegal argument mode for argument at pos ${argumentPointer} is ${mode}`);
        }
    }

    private saveTo(location: number | bigint, value: bigint) {
        //console.log("saving", value, "to", location, "in", memory);
        this[Number(location)] = value;
    }

    runComputer(input: Input = [], waitOnInput: boolean = false, inPlace: boolean = false): Pair<boolean, Pair<ComputerMemory, Output>> {
        const computeMemory: ComputerMemory = (inPlace) ? this : new ComputerMemory(...this);
        const outputs: Output = [];
        for (let pointer: Pointer = 0, memLength = computeMemory.length; pointer < memLength;) {
            const currentInstruction = computeMemory.instruction(pointer);
            //console.log("*", pointer, computeMemory, currentInstruction, computeMemory[pointer], instructionArgumentModes(computeMemory[pointer], 4n));
            switch (currentInstruction) {
                case 1n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 2n);
                    //console.log("times", pointer, computeMemory[pointer], modes, "saving to", computeMemory[pointer + 3]);
                    computeMemory.saveTo(
                        computeMemory[pointer + 3],
                        computeMemory.argumentWithMode(pointer + 1, modes[0])
                        +
                        computeMemory.argumentWithMode(pointer + 2, modes[1])
                    );
                    pointer += 4;
                    break;
                }
                case 2n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 2n);
                    //console.log("times", pointer, computeMemory[pointer], modes, "saving to", computeMemory[pointer + 3]);
                    computeMemory.saveTo(
                        computeMemory[pointer + 3],
                        computeMemory.argumentWithMode(pointer + 1, modes[0])
                        *
                        computeMemory.argumentWithMode(pointer + 2, modes[1])
                    );
                    pointer += 4;
                    break;
                }
                case 3n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 0n);
                    //console.log("read", pointer, computeMemory[pointer], modes, "saving to", computeMemory[pointer + 1], ", possible input:", input[0]);
                    let readIn;
                    if (input[0] !== undefined) {
                        console.log(`At instruction ${pointer} need input, which will be get from storage. (${input[0]})`);
                        readIn = input.splice(0, 1)[0];
                    } else if (waitOnInput) {
                        console.log(`At instruction ${pointer} need input, pausing computer.`);
                        return new Pair<boolean, Pair<ComputerMemory, Output>>(false, new Pair<ComputerMemory, Output>(computeMemory, outputs));
                    } else {
                        readIn = BigInt(readline.question(`At instruction ${pointer} we need a input: `));
                    }
                    computeMemory.saveTo(computeMemory[pointer + 1], readIn);
                    pointer += 2;
                    break;
                }
                case 4n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 1n);
                    //console.log("print", pointer, computeMemory[pointer], computeMemory[pointer + 1], modes);
                    const out = computeMemory.argumentWithMode(pointer + 1, modes[0]);
                    outputs.push(out);
                    console.log(`At instruction ${pointer} got: ${out}`);
                    pointer += 2;
                    break;
                }
                case 5n:
                case 6n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 2n);
                    //console.log("jump-if-true/false", currentInstruction, argumentWithMode(pointer + 1, modes[0], computeMemory), pointer, computeMemory[pointer], computeMemory[pointer + 1], modes);
                    if (Boolean(computeMemory.argumentWithMode(pointer + 1, modes[0])) === Boolean(6n - currentInstruction)) {
                        pointer = Number(computeMemory.argumentWithMode(pointer + 2, modes[1]));
                        //console.log("jumping to", pointer);
                    } else {
                        pointer += 3;
                    }
                    break;
                }
                case 7n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 2n);
                    //console.log("less than", pointer, computeMemory[pointer], computeMemory[pointer + 1], modes);
                    computeMemory.saveTo(computeMemory[pointer + 3],
                        BigInt(
                            computeMemory.argumentWithMode(pointer + 1, modes[0])
                            <
                            computeMemory.argumentWithMode(pointer + 2, modes[1])
                        )
                    );
                    pointer += 4;
                    break;
                }
                case 8n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 2n);
                    //console.log("equals", pointer, computeMemory[pointer], computeMemory[pointer + 1], modes);//, BigInt(argumentWithMode(pointer + 1, modes[0], computeMemory) == argumentWithMode(pointer + 2, modes[1], computeMemory)), argumentWithMode(pointer + 3, modes[0], computeMemory));
                    computeMemory.saveTo(computeMemory[pointer + 3],
                        BigInt(
                            computeMemory.argumentWithMode(pointer + 1, modes[0])
                            ==
                            computeMemory.argumentWithMode(pointer + 2, modes[1])
                        )
                    );
                    pointer += 4;
                    break;
                }
                case 99n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 0n);
                    pointer = computeMemory.length;
                    break;
                }
                default:
                    throw new Error("Unknown opcode " + computeMemory[pointer]);
            }
        }
        return new Pair<boolean, Pair<ComputerMemory, Output>>(true, new Pair<ComputerMemory, Output>(computeMemory, outputs));
    }
}

const inputMemory: ComputerMemory = new ComputerMemory(3, 8, 1001, 8, 10, 8, 105, 1, 0, 0, 21, 38, 63, 72, 81, 106, 187, 268, 349, 430, 99999, 3, 9, 101, 5, 9, 9, 1002, 9, 3, 9, 101, 3, 9, 9, 4, 9, 99, 3, 9, 102, 3, 9, 9, 101, 4, 9, 9, 1002, 9, 2, 9, 1001, 9, 2, 9, 1002, 9, 4, 9, 4, 9, 99, 3, 9, 1001, 9, 3, 9, 4, 9, 99, 3, 9, 102, 5, 9, 9, 4, 9, 99, 3, 9, 102, 4, 9, 9, 1001, 9, 2, 9, 1002, 9, 5, 9, 1001, 9, 2, 9, 102, 3, 9, 9, 4, 9, 99, 3, 9, 1001, 9, 2, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 101, 2, 9, 9, 4, 9, 3, 9, 102, 2, 9, 9, 4, 9, 3, 9, 101, 2, 9, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 101, 1, 9, 9, 4, 9, 3, 9, 102, 2, 9, 9, 4, 9, 3, 9, 101, 2, 9, 9, 4, 9, 99, 3, 9, 1001, 9, 2, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 101, 1, 9, 9, 4, 9, 3, 9, 102, 2, 9, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 101, 2, 9, 9, 4, 9, 3, 9, 101, 1, 9, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 99, 3, 9, 102, 2, 9, 9, 4, 9, 3, 9, 1001, 9, 2, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 101, 2, 9, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 101, 2, 9, 9, 4, 9, 3, 9, 102, 2, 9, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 101, 2, 9, 9, 4, 9, 99, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 101, 2, 9, 9, 4, 9, 3, 9, 101, 1, 9, 9, 4, 9, 3, 9, 101, 1, 9, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 99, 3, 9, 102, 2, 9, 9, 4, 9, 3, 9, 101, 1, 9, 9, 4, 9, 3, 9, 101, 1, 9, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 101, 1, 9, 9, 4, 9, 3, 9, 102, 2, 9, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 102, 2, 9, 9, 4, 9, 3, 9, 101, 2, 9, 9, 4, 9, 99);
const options: Input = [5n, 6n, 7n, 8n, 9n];

function iterate(initialInputs: Array<ComputerMemory>): bigint {
    const inputs: Array<ComputerMemory> = initialInputs.map(it => new ComputerMemory(...it));

    while (true) {
        for (let amp of inputs.entries()) {
            const out = inputMemory.runComputer(amp[1], true);
            const output: Output = out.second.second;
            const halted: boolean = out.first;
            const nextAmp = (amp[0] + 1) % inputs.length;
            inputs[nextAmp] = initialInputs[nextAmp].concat(output);
            if (halted && amp[0] == inputs.length - 1) return inputs[0][inputs[0].length - 1];
        }
    }
}

function findMaxOutput(options: Input): bigint {
    const output = options.permute().map(phases => {
            const initialInputs: Array<ComputerMemory> = phases.map(it => new ComputerMemory(it));
            initialInputs[0].push(0n);
            return iterate(initialInputs)
        }
    );
    let max = 0n;
    for (let o of output) if (max < o) max = o;
    return max;
}

console.log(findMaxOutput(options));
