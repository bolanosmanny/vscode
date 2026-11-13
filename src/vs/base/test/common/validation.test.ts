/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { vNumber, vObj, vOptionalProp, vString, vUndefined, vUnion } from '../../common/validation.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from './utils.js';

suite('Validation', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	suite('object validator', () => {
		test('valid input copies declared fields and discards extra fields', () => {
			const validator = vObj({ name: vString(), age: vOptionalProp(vNumber()) });
			assert.deepStrictEqual(validator.validate({ name: 'Ada', age: 37, ignored: true }), {
				content: { name: 'Ada', age: 37 }, error: undefined
			});
		});

		test('missing optional field is omitted from the result', () => {
			const validator = vObj({ name: vString(), age: vOptionalProp(vNumber()) });
			assert.deepStrictEqual(validator.validate({ name: 'Ada' }), {
				content: { name: 'Ada' }, error: undefined
			});
		});

		test('invalid required field reports its property path', () => {
			const validator = vObj({ name: vString() });
			assert.deepStrictEqual(validator.validate({ name: 42 }), {
				content: undefined, error: { message: 'Error in property \'name\': Expected string, but got number' }
			});
		});
	});

	suite('union validator', () => {
		test('valid input accepts either member type', () => {
			const validator = vUnion(vString(), vNumber());
			assert.deepStrictEqual([validator.validate('line'), validator.validate(12)], [
				{ content: 'line', error: undefined },
				{ content: 12, error: undefined }
			]);
		});

		test('undefined member accepts an absent value', () => {
			assert.deepStrictEqual(vUnion(vString(), vUndefined()).validate(undefined), {
				content: undefined, error: undefined
			});
		});

		test('unmatched input reports the final member error', () => {
			assert.deepStrictEqual(vUnion(vString(), vNumber()).validate(false), {
				content: undefined, error: { message: 'Expected number, but got boolean' }
			});
		});
	});
});
