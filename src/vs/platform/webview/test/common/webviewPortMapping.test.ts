/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { URI } from '../../../../base/common/uri.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { IAddress } from '../../../remote/common/remoteAgentConnection.js';
import { ManagedRemoteConnection } from '../../../remote/common/remoteAuthorityResolver.js';
import { ITunnelService, RemoteTunnel } from '../../../tunnel/common/tunnel.js';
import { WebviewPortMappingManager } from '../../common/webviewPortMapping.js';

suite('WebviewPortMappingManager', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	const remoteAuthority: IAddress = { connectTo: new ManagedRemoteConnection(1), connectionToken: undefined };

	function createManager(extensionLocation: URI | undefined, tunnelResult?: RemoteTunnel | string): WebviewPortMappingManager {
		const tunnelService = { openTunnel: async () => tunnelResult } as Partial<ITunnelService> as ITunnelService;
		return new WebviewPortMappingManager(
			() => extensionLocation,
			() => [{ webviewPort: 3000, extensionHostPort: 4000 }],
			tunnelService
		);
	}

	test('local extension redirects a mapped localhost URL to the extension port', async () => {
		const manager = createManager(URI.file('/extension'));
		assert.strictEqual(await manager.getRedirect(undefined, 'http://localhost:3000/path'), 'http://localhost:4000/path');
		await manager.dispose();
	});

	test('unmapped or non-HTTP URLs have no redirect', async () => {
		const manager = createManager(URI.file('/extension'));
		assert.deepStrictEqual([
			await manager.getRedirect(undefined, 'http://localhost:3001/path'),
			await manager.getRedirect(undefined, 'file:///localhost:3000/path')
		], [undefined, undefined]);
		await manager.dispose();
	});

	test('remote tunnel failure falls back to the configured port mapping', async () => {
		const manager = createManager(URI.parse('vscode-remote://ssh-remote+server/extension'), 'Tunnel unavailable');
		assert.strictEqual(await manager.getRedirect(remoteAuthority, 'http://localhost:3000/path'), 'http://localhost:4000/path');
		await manager.dispose();
	});
});
