type CoordinateType = bigint;

class Vector {
    readonly length?: number;
    constructor(readonly x: CoordinateType, readonly y: CoordinateType, readonly z: CoordinateType, setLength: boolean = false) {
        if (setLength) this.length = Math.sqrt(Number(x * x + y * y + z * z))
    }

    static from(input: string[]): Vector {
        return new Vector(
            BigInt(input.find(it => it.startsWith('x=')).slice(2)),
            BigInt(input.find(it => it.startsWith('y=')).slice(2)),
            BigInt(input.find(it => it.startsWith('z=')).slice(2))
        )
    }

    plus(vector: Vector): Vector {
        return new Vector(this.x + vector.x, this.y + vector.y, this.z + vector.z);
    }

    get absX(): bigint {
        return (this.x < 0) ? -this.x : this.x;
    }

    get absY(): bigint {
        return (this.y < 0) ? -this.y : this.y;
    }

    get absZ(): bigint {
        return (this.z < 0) ? -this.z : this.z;
    }

    get sum(): bigint {
        return this.absX + this.absY + this.absZ;
    }

    equals(other: Vector): boolean {
        return this.x === other.x && this.y === other.y && this.z === other.z;
    }
}

class Moon {
    constructor(readonly position: Vector, readonly velocity: Vector) {
    }

    applyGravity(original: Moon, second: Moon): Moon {
        const x = (original.position.x < second.position.x) ? 1n : (original.position.x > second.position.x) ? -1n : 0n;
        const y = (original.position.y < second.position.y) ? 1n : (original.position.y > second.position.y) ? -1n : 0n;
        const z = (original.position.z < second.position.z) ? 1n : (original.position.z > second.position.z) ? -1n : 0n;
        //console.log('updating', original, 'with', second.position, 'to', new Moon(this.position, this.velocity.plus(new Vector(x, y, z))));
        return new Moon(this.position, this.velocity.plus(new Vector(x, y, z)))
    }

    applyVelocity(): Moon {
        return new Moon(this.position.plus(this.velocity), this.velocity);
    }

    get potentialEnergy(): bigint {
        return this.position.sum
    }

    get kineticEnergy(): bigint {
        return this.velocity.sum
    }

    get totalEnergy(): bigint {
        return this.potentialEnergy * this.kineticEnergy
    }

    equals(other: Moon): boolean {
        return this.position.equals(other.position) && this.velocity.equals(other.velocity)
    }
}

const initialMoons: Array<Moon> = ("<x=-3, y=15, z=-11>\n" +
    "<x=3, y=13, z=-19>\n" +
    "<x=-13, y=18, z=-2>\n" +
    "<x=6, y=0, z=-1>").split('\n').map(moonString => {
    return new Moon(
        Vector.from(moonString
            .slice(1, moonString.length - 1)
            .split(', ')
        ),
        new Vector(0n, 0n, 0n)
    );
});
let moons = initialMoons;
let timeSteps: bigint = 0n;

let moonCircle: Vector = new Vector(0n, 0n, 0n);
for (; moonCircle.x === 0n || moonCircle.y === 0n || moonCircle.z === 0n; timeSteps++) {
    let calculatingMoons: Array<Moon> = [].concat(moons);

    for (let i = 0; i < moons.length; i++) {
        for (let j = 0; j < moons.length; j++) {
            if (i === j) continue;
            calculatingMoons[i] = calculatingMoons[i].applyGravity(moons[i], moons[j]);
        }
    }

    for (let i = 0; i < moons.length; i++) {
        calculatingMoons[i] = calculatingMoons[i].applyVelocity()
    }

    moons = calculatingMoons;

    if (moonCircle.x === 0n && initialMoons.every((value, index) =>
        value.position.x === moons[index].position.x && value.velocity.x === moons[index].velocity.x
    )) {
        moonCircle = new Vector(timeSteps + 1n, moonCircle.y, moonCircle.z);
        console.log('found x', moonCircle);
    }
    if (moonCircle.y === 0n && initialMoons.every((value, index) =>
        value.position.y === moons[index].position.y && value.velocity.y === moons[index].velocity.y
    )) {
        moonCircle = new Vector(moonCircle.x, timeSteps + 1n, moonCircle.z);
        console.log('found y', moonCircle);
    }
    if (moonCircle.z === 0n && initialMoons.every((value, index) =>
        value.position.z === moons[index].position.z && value.velocity.z === moons[index].velocity.z
    )) {
        moonCircle = new Vector(moonCircle.x, moonCircle.y, timeSteps + 1n);
        console.log('found z', moonCircle);
    }
}

function gcd(a: bigint, b: bigint): bigint {
    if (a == 0n) return b;
    return gcd(b%a, a);
}
function lcm(a: bigint, b: bigint): bigint {
    return a * b / gcd(a, b);
}
function multiLcm(nums: Array<bigint>): bigint {
    let currentLcm: bigint = 1n;
    for (let a of nums) {
        currentLcm = lcm(currentLcm, a);
    }
    return currentLcm;
}

console.log(multiLcm([moonCircle.x, moonCircle.y, moonCircle.z]));
