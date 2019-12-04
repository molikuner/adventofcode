const input = "272091-815432";
const a = BigInt(input.split("-")[0]);
const b = BigInt(input.split("-")[1]);

function countCandidates(regex: RegExp): bigint {
    function ascending(input: string): boolean {
        for (let i = 0; i < input.length - 1; i++) {
            if (BigInt(input.charAt(input.length - i - 1)) < BigInt(input.charAt(input.length - i - 2))) return false;
        }
        return true;
    }
    let count = 0n;
    for (let i = a; i <= b; i++) {
        const iString = i.toString();
        if (regex.test(iString) && ascending(iString)) count++;
    }
    return count;
}

console.log("Part 1:", countCandidates(RegExp("(\\d)\\1")));
