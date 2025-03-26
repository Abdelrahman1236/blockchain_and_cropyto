
"use strict";
const blindSignatures = require("blind-signatures");
const { Coin, COIN_RIS_LENGTH, IDENT_STR } = require("./coin.js");
const utils = require("./utils.js");

// إنشاء مفتاح البنك
const BANK_KEY = blindSignatures.keyGeneration({ b: 2048 });
const { n: N, e: E } = BANK_KEY.keyPair;

/**
 * توقيع العملة باستخدام توقيع أعمى
 * @param {BigInteger} blindedCoinHash - الهاش المعمى للعملة
 * @returns {BigInteger} - التوقيع من البنك
 */
function signCoin(blindedCoinHash) {
    if (!blindedCoinHash) {
        throw new Error("blindedCoinHash مش موجود!");
    }
    return blindSignatures.sign({ blinded: blindedCoinHash, key: BANK_KEY });
}

/**
 * التحقق من صحة العملة لدى التاجر
 * @param {Coin} coin - العملة التي يتم التحقق منها
 * @returns {String} - جزء من هوية المستخدم للتحقق
 */
function acceptCoin(coin) {
    if (!coin?.signature) {
        throw new Error("العملة أو توقيعها غير موجود!");
    }

    const isValid = blindSignatures.verify({
        unblinded: coin.signature,
        N: coin.N,
        E: coin.E,
        message: coin.blindedMessage
    });

    if (!isValid) {
        throw new Error("توقيع العملة غير صالح!");
    }

    const [lh, rh] = parseCoin(coin.toString());
    return Math.random() < 0.5 ? lh : rh;
}

/**
 * تحديد الغشاش في حالة الإنفاق المزدوج
 * @param {string} guid - المعرف العالمي للعملة
 * @param {Array} ris1 - هوية المالك عند التاجر الأول
 * @param {Array} ris2 - هوية المالك عند التاجر الثاني
 */
function determineCheater(guid, ris1, ris2) {
    for (let i = 0; i < ris1.length; i++) {
        if (utils.xor(ris1[i], ris2[i]).startsWith(IDENT_STR)) {
            console.log(`🚨 الغشاش هو مالك العملة ${guid}`);
            return;
        }
    }
    console.log(`🚨 التاجر هو الغشاش للعملة ${guid}`);
}

// إنشاء عملة جديدة
const coin = new Coin("alice", 20, N.toString(), E.toString());
console.log("إنشاء عملة جديدة:", coin);

// توقيع العملة
coin.signature = signCoin(coin.blinded);
console.log("توقيع العملة:", coin.signature);

// إلغاء التعمية
coin.unblind();
console.log("العملة بعد إلغاء التعمية:", coin);

// التاجر الأول يقبل العملة
const ris1 = acceptCoin(coin);

// التاجر الثاني يقبل العملة (محاولة إنفاق مزدوج)
const ris2 = acceptCoin(coin);

// تحديد الغشاش
determineCheater(coin.guid, ris1, ris2);

