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

suite('WebviewPortMappingManager remote tunnel regression', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	test('successful remote tunnel redirects, is reused, and is disposed', async () => {
		let openTunnelCalls = 0;
		let disposeCalls = 0;
		const tunnel: RemoteTunnel = {
			tunnelRemoteHost: 'localhost',
			tunnelRemotePort: 4000,
			tunnelLocalPort: 5000,
			localAddress: '127.0.0.1:5000',
			privacy: 'private',
			dispose: async () => { disposeCalls++; }
		};
		const tunnelService = {
			openTunnel: async () => { openTunnelCalls++; return tunnel; }
		} as Partial<ITunnelService> as ITunnelService;
		const manager = new WebviewPortMappingManager(
			() => URI.parse('vscode-remote://ssh-remote+server/extension'),
			() => [{ webviewPort: 3000, extensionHostPort: 4000 }],
			tunnelService
		);
		const remoteAuthority: IAddress = { connectTo: new ManagedRemoteConnection(1), connectionToken: undefined };
		const redirects = [
			await manager.getRedirect(remoteAuthority, 'http://localhost:3000/path'),
			await manager.getRedirect(remoteAuthority, 'http://localhost:3000/path')
		];
		await manager.dispose();
		assert.deepStrictEqual({ redirects, openTunnelCalls, disposeCalls }, {
			redirects: ['http://127.0.0.1:5000/path', 'http://127.0.0.1:5000/path'],
			openTunnelCalls: 1,
			disposeCalls: 1
		});
	});
});
