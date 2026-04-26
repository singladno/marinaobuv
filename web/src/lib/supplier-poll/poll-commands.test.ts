import assert from 'assert';

import { parseSupplierPollGptResult } from './poll-commands';

assert.deepStrictEqual(
  parseSupplierPollGptResult({
    outcome: 'NO_OP',
    reason: 'wait',
  }),
  { outcome: 'NO_OP', reason: 'wait' }
);

assert.strictEqual(
  parseSupplierPollGptResult({
    outcome: 'APPLY',
    commands: [],
  }),
  null,
  'APPLY with empty commands must fail schema (min 1)'
);

const parsed = parseSupplierPollGptResult({
  outcome: 'APPLY',
  commands: [
    {
      type: 'SET_ITEM_STOCK',
      order_item_id: 'a',
      stock: 'available',
      confidence: 0.9,
    },
    {
      type: 'SEND_SUPPLIER_MESSAGE',
      text: 'Привет',
    },
  ],
});
assert.ok(parsed && parsed.outcome === 'APPLY');
if (parsed?.outcome === 'APPLY') {
  assert.strictEqual(parsed.commands.length, 2);
  assert.strictEqual(parsed.commands[1].type, 'SEND_SUPPLIER_MESSAGE');
}

assert.strictEqual(
  parseSupplierPollGptResult({
    outcome: 'APPLY',
    commands: [{ type: 'REMOVE_ORDER_ITEM', order_item_id: 'x' }] as never,
  }),
  null,
  'unknown command types must be rejected by schema'
);

const resend = parseSupplierPollGptResult({
  outcome: 'APPLY',
  commands: [
    { type: 'RESEND_PRODUCT_IMAGES' },
    { type: 'SEND_SUPPLIER_MESSAGE', text: 'Секунду, дублирую фото.' },
  ],
});
assert.ok(resend && resend.outcome === 'APPLY');
if (resend?.outcome === 'APPLY') {
  assert.strictEqual(resend.commands[0].type, 'RESEND_PRODUCT_IMAGES');
}

const ask = parseSupplierPollGptResult({
  outcome: 'APPLY',
  commands: [
    {
      type: 'SET_ITEM_STOCK',
      order_item_id: 'x1',
      stock: 'unavailable',
      confidence: 0.9,
    },
    { type: 'ASK_REPLACEMENT_FOR_ITEM', order_item_id: 'x1' },
    { type: 'ASK_REPLACEMENT_FOR_ITEM', order_item_id: 'x2' },
  ],
});
assert.ok(ask && ask.outcome === 'APPLY');
if (ask?.outcome === 'APPLY') {
  assert.strictEqual(ask.commands[1].type, 'ASK_REPLACEMENT_FOR_ITEM');
  if (ask.commands[1].type === 'ASK_REPLACEMENT_FOR_ITEM') {
    assert.strictEqual(ask.commands[1].order_item_id, 'x1');
  }
}

console.log('poll-commands.test.ts: ok');
