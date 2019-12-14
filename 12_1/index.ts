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
for (let timeStep = 0; timeStep < 1000; timeStep++) {
    let calculatingMoons: Array<Moon> = [].concat(moons);

    // apply gravity to velocity of moons
    //      get all pairs of moons
    //      look at all coordinates (x in following)
    //          higher coordinate gets +1 at velocity
    //          lower coordinate gets -1 at velocity
    //          equal does't change anything
    for (let i = 0; i < moons.length; i++) {
        for (let j = 0; j < moons.length; j++) {
            if (i === j) continue;
            calculatingMoons[i] = calculatingMoons[i].applyGravity(moons[i], moons[j]);
        }
    }

    // update position by applying velocity
    for (let i = 0; i < moons.length; i++) {
        calculatingMoons[i] = calculatingMoons[i].applyVelocity()
    }

    moons = calculatingMoons;

    //console.log(timeStep, moons);
}

let totalSystemEnergy: bigint = 0n;
for (let i = 0; i < moons.length; i++) {
    totalSystemEnergy += moons[i].totalEnergy
}
console.log(totalSystemEnergy);
