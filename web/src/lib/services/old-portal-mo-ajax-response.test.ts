import assert from 'assert';

import { interpretMoAjaxResponseBody } from './old-portal-mo-ajax-response';

interpretMoAjaxResponseBody('Записано товаров: 1 из 1.');

let threw = false;
try {
  interpretMoAjaxResponseBody(
    '<p style="color:red">Файл выгрузки отсутствует или не содержит товаров.</p>'
  );
} catch {
  threw = true;
}
assert.strictEqual(threw, true);

threw = false;
try {
  interpretMoAjaxResponseBody('Записано товаров: 0 из 3.');
} catch (e) {
  threw = true;
  assert.ok(e instanceof Error && e.message.includes('0 из 3'));
}
assert.strictEqual(threw, true);
