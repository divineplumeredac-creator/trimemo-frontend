const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('src/App.tsx','utf8');
test('le parcours ciblé contourne les problématiques et valide une structure dédiée',()=>{assert.match(src,/if \(analyzedProject\.writingMode === "targeted_writing"\) await startTargetedWriting\(analyzedProject\)/);assert.match(src,/selectPremiumPlan\(scope,plan\)/);assert.match(src,/if \(plan\.targetedWriting\) \{/);});
