class Chemical {
    constructor(readonly amount: bigint, readonly name: string) {
    }

    static from(input: String): Chemical {
        const split = input.split(' ');
        return new Chemical(BigInt(split[0]), split[1])
    }
}

type Ingredients = Chemical[]
type Reaction = [Ingredients, Chemical]

const availableReactions: Reaction[] = ("1 QDKHC => 9 RFSZD\n" +
    "15 FHRN, 17 ZFSLM, 2 TQFKQ => 3 JCHF\n" +
    "4 KDPV => 4 TQFKQ\n" +
    "1 FSTRZ, 5 QNXWF, 2 RZSD => 3 FNJM\n" +
    "15 VQPC, 1 TXCJ => 3 WQTL\n" +
    "1 PQCQN, 6 HKXPJ, 16 ZFSLM, 6 SJBPT, 1 TKZNJ, 13 JBDF, 1 RZSD => 6 VPCP\n" +
    "1 LJGZP => 7 VNGD\n" +
    "1 CTVB, 1 HVGW => 1 LJGZP\n" +
    "6 HVGW, 1 HJWT => 2 VDKF\n" +
    "10 PQCQN, 7 WRQLB, 1 XMCH => 3 CDMX\n" +
    "14 VNGD, 23 ZFSLM, 2 FHRN => 4 SJBPT\n" +
    "1 FSTRZ, 4 VTWB, 2 BLJC => 4 CKFW\n" +
    "2 ZTFH, 19 CKFW, 2 FHRN, 4 FNJM, 9 NWTVF, 11 JBDF, 1 VDKF, 2 DMRCN => 4 HMLTV\n" +
    "1 KVZXR => 5 FPMSL\n" +
    "8 XBZJ => 8 QDKHC\n" +
    "1 VQPC => 9 FHRN\n" +
    "15 RKTFX, 5 HKXPJ => 4 ZFSLM\n" +
    "1 HKXPJ, 8 LQCTQ, 21 VJGKN => 5 QCKFR\n" +
    "1 DCLQ, 1 TQFKQ => 4 KVZXR\n" +
    "4 NWTVF, 20 QNXWF => 9 JFLQD\n" +
    "11 QFVR => 3 RZSD\n" +
    "9 RFSZD, 6 WQTL => 7 JBDF\n" +
    "4 BLJC, 3 LQCTQ, 1 QCKFR => 8 QFVR\n" +
    "6 VNGD => 5 VQPC\n" +
    "7 CTMR, 10 SJBPT => 9 VTWB\n" +
    "1 VTWB => 9 DMRCN\n" +
    "6 BCGLR, 4 TPTN, 29 VNGD, 25 KDQC, 40 JCHF, 5 HMLTV, 4 CHWS, 2 CDMX, 1 VPCP => 1 FUEL\n" +
    "1 TQFKQ, 3 FPMSL, 7 KDPV => 6 RKTFX\n" +
    "8 HKXPJ, 2 WQTL => 6 WRQLB\n" +
    "146 ORE => 3 KDPV\n" +
    "9 KDQC => 2 XMCH\n" +
    "1 BGVXG, 21 KVZXR, 1 LQCTQ => 4 CTVB\n" +
    "1 LQCTQ => 5 VJGKN\n" +
    "16 VNGD, 5 VMBM => 1 CTMR\n" +
    "5 VCVTM, 1 FPMSL => 5 HKXPJ\n" +
    "4 HKXPJ => 5 BLJC\n" +
    "14 FHRN, 6 ZFSLM => 1 NWTVF\n" +
    "7 QCKFR, 2 VNGD => 7 VMBM\n" +
    "4 TXCJ, 1 VDKF => 2 QNXWF\n" +
    "136 ORE => 6 BGVXG\n" +
    "5 LQCTQ, 11 DCLQ => 9 XBZJ\n" +
    "3 VQPC => 7 ZTFH\n" +
    "114 ORE => 3 ZWFZX\n" +
    "1 HJWT, 18 KDPV => 7 TXCJ\n" +
    "1 VJGKN => 2 VCVTM\n" +
    "2 KVZXR => 1 HJWT\n" +
    "12 ZWFZX, 1 FHRN, 9 JFLQD => 1 CHWS\n" +
    "3 QFVR => 5 FSTRZ\n" +
    "5 XBZJ => 4 HVGW\n" +
    "1 ZWFZX => 8 LQCTQ\n" +
    "16 WQTL, 10 TXCJ => 9 KDQC\n" +
    "3 FHRN, 12 LJGZP => 5 TPTN\n" +
    "1 JCHF => 7 PQCQN\n" +
    "7 KDPV, 17 BGVXG => 7 DCLQ\n" +
    "1 CKFW, 3 TKZNJ, 4 PQCQN, 1 VQPC, 32 QFVR, 1 FNJM, 13 FSTRZ => 3 BCGLR\n" +
    "2 FSTRZ => 5 TKZNJ").split('\n')
    .map(reaction => reaction.split(' => ') as [string, string])
    .map(reaction =>
        [reaction[0].split(', ').map(ingredient => Chemical.from(ingredient)), Chemical.from(reaction[1])]
    );

function request(chemical: Chemical): Reaction {
    const reaction: Reaction = availableReactions.find(it => it[1].name == chemical.name);
    if (!reaction) throw new Error(`Could not find any reaction producing ${chemical.name}!`);

    const reactionAmount = (reaction[1].amount < chemical.amount) ? BigInt(Math.ceil(Number(chemical.amount) / Number(reaction[1].amount))) : 1n;

    return [reaction[0].map(it => new Chemical(it.amount * reactionAmount, it.name)), new Chemical(reaction[1].amount * reactionAmount, reaction[1].name)];
}

function countOreNeeded(chemical: Chemical, tooMuchProduced: Chemical[] = []): [bigint, Chemical[]] {
    if (chemical.name == "ORE") return [chemical.amount, tooMuchProduced];
    const producingReaction = request(chemical);

    const neededIngredients = producingReaction[0].map(ingredient => {
        const previousProduced = tooMuchProduced.find(it => it.name == ingredient.name);
        if (!previousProduced) return ingredient;

        tooMuchProduced.splice(tooMuchProduced.indexOf(previousProduced), 1);
        const stillNeeded = new Chemical(ingredient.amount - previousProduced.amount, ingredient.name);

        if (stillNeeded.amount < 0) {
            tooMuchProduced.push(new Chemical(-stillNeeded.amount, stillNeeded.name))
        } else if (stillNeeded.amount > 0) {
            return stillNeeded
        }
        return null;
    }).filter(ingredient => !!ingredient);

    if (producingReaction[1].amount > chemical.amount) {
        const previousProduced = tooMuchProduced.find(it => it.name == chemical.name);
        if (previousProduced) {
            tooMuchProduced.splice(tooMuchProduced.indexOf(previousProduced), 1);
            tooMuchProduced.push(new Chemical(previousProduced.amount + (producingReaction[1].amount - chemical.amount), chemical.name))
        } else {
            tooMuchProduced.push(new Chemical(producingReaction[1].amount - chemical.amount, chemical.name))
        }
    }

    const ingredientOreCount = neededIngredients.map(ingredient => countOreNeeded(ingredient, tooMuchProduced));

    let sum = 0n;
    ingredientOreCount.forEach(it => sum += it[0]);
    return [sum, tooMuchProduced];
}

function produceFuel(oreAmount: bigint): [bigint, bigint, Chemical[]] {
    let created = 3756000n;
    // I did 1000 per step in the beginning and set this number afterwards
    let [oreUsed, leftOvers] = countOreNeeded(Chemical.from("3756000 FUEL"));
    while (oreUsed < oreAmount) {
        let [newlyOreUsed, newlyLeftOvers] = countOreNeeded(Chemical.from("1 FUEL"), [].concat(leftOvers));
        if (oreUsed + newlyOreUsed > oreAmount) break;
        created += 1n;
        leftOvers = newlyLeftOvers;
        oreUsed += newlyOreUsed;
    }
    return [created, oreUsed, leftOvers];
}

console.log(produceFuel(1000000000000n));
