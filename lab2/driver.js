
"use strict";

let blindSignatures = require('blind-signatures');
let SpyAgency = require('./spyAgency.js').SpyAgency;

function makeDocument(coverName) {
  return `The bearer of this signed document, ${coverName}, has full diplomatic immunity.`;
}

function blind(msg, n, e) {
  return blindSignatures.blind({
    message: msg,
    N: n,
    E: e,
  });
}

function unblind(blindingFactor, sig, n) {
  return blindSignatures.unblind({
    signed: sig,
    N: n,
    r: blindingFactor,
  });
}

let agency = new SpyAgency();


let coverNames = [
  "John Doe", "Alice Smith", "Bob Johnson", "Charlie Brown", "David White",
  "Emma Green", "Frank Black", "Grace Blue", "Hank Red", "Ivy Purple"
];


let documents = coverNames.map(makeDocument);


let blindedDocs = [];
let blindingFactors = [];

documents.forEach((doc) => {
  let { blinded, r } = blind(doc, agency.n, agency.e);
  blindedDocs.push(blinded);
  blindingFactors.push(r);
});


agency.signDocument(blindedDocs, (selected, verifyAndSign) => {
  
  let factorsToSign = blindingFactors.map((r, index) => index === selected ? undefined : r);
  let docsToSign = documents.map((doc, index) => index === selected ? undefined : doc);

  
  let signedBlinded = verifyAndSign(factorsToSign, docsToSign);

  
  let unblindedSignature = unblind(blindingFactors[selected], signedBlinded, agency.n);

  
  console.log(`Original Document: ${documents[selected]}`);
  console.log(`Signature: ${unblindedSignature}`);
});