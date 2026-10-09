/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FileType, l10n, LogOutputChannel, QuickDiffProvider, Uri, workspace } from 'vscode';
import { IRepositoryResolver, Repository } from './repository';
import { isDescendant, pathEquals } from './util';
import { toGitUri } from './uri';
import { Status } from './api/git.constants';

/** Shared quick diff workflow; subclasses decide which files and Git revision apply. */
abstract class AbstractGitQuickDiffProvider implements QuickDiffProvider {
	abstract readonly label: string;

	constructor(
		private readonly logger: LogOutputChannel,
		private readonly tracePrefix: string
	) { }

	async provideOriginalResource(uri: Uri): Promise<Uri | undefined> {
		this.trace(`Resource: ${uri.toString()}`);

		if (uri.scheme !== 'file') {
			this.trace(`Resource is not a file: ${uri.scheme}`);
			return undefined;
		}

		if (!this.isCandidate(uri)) {
			return undefined;
		}

		const stat = await workspace.fs.stat(uri);
		if ((stat.type & FileType.SymbolicLink) !== 0) {
			this.trace(`Resource is a symbolic link: ${uri.toString()}`);
			return undefined;
		}

		if (!await this.isEligible(uri)) {
			return undefined;
		}

		const originalResource = toGitUri(uri, this.originalRef, { replaceFileExtension: true });
		this.trace(`Original resource: ${originalResource.toString()}`);
		return originalResource;
	}

	protected trace(message: string): void {
		this.logger.trace(`${this.tracePrefix} ${message}`);
	}

	protected abstract isCandidate(uri: Uri): boolean;
	protected abstract isEligible(uri: Uri): Promise<boolean> | boolean;
	protected abstract get originalRef(): string;
}

export class GitQuickDiffProvider extends AbstractGitQuickDiffProvider {
	readonly label = l10n.t('Git Local Changes (Working Tree)');
	protected get originalRef(): string { return ''; }

	constructor(
		private readonly repository: Repository,
		private readonly repositoryResolver: IRepositoryResolver,
		logger: LogOutputChannel
	) {
		super(logger, '[Repository][provideOriginalResource]');
	}

	protected isCandidate(uri: Uri): boolean {
		// Ignore path that is inside the .git directory (ex: COMMIT_EDITMSG)
		if (isDescendant(this.repository.dotGit.commonPath ?? this.repository.dotGit.path, uri.fsPath)) {
			this.trace(`Resource is inside .git directory: ${uri.toString()}`);
			return false;
		}
		return true;
	}

	protected async isEligible(uri: Uri): Promise<boolean> {
		// Ignore path that is not inside the current repository
		if (this.repositoryResolver.getRepository(uri) !== this.repository) {
			this.trace(`Resource is not part of the repository: ${uri.toString()}`);
			return false;
		}

		// Ignore path that is inside a hidden repository
		if (this.repository.isHidden === true) {
			this.trace(`Repository is hidden: ${uri.toString()}`);
			return false;
		}

		// Ignore path that is inside a merge group
		if (this.repository.mergeGroup.resourceStates.some(r => pathEquals(r.resourceUri.fsPath, uri.fsPath))) {
			this.trace(`Resource is part of a merge group: ${uri.toString()}`);
			return false;
		}

		// Ignore path that is untracked
		if (this.repository.untrackedGroup.resourceStates.some(r => pathEquals(r.resourceUri.path, uri.path)) ||
			this.repository.workingTreeGroup.resourceStates.some(r => pathEquals(r.resourceUri.path, uri.path) && r.type === Status.UNTRACKED)) {
			this.trace(`Resource is untracked: ${uri.toString()}`);
			return false;
		}

		// Ignore path that is git ignored
		const ignored = await this.repository.checkIgnore([uri.fsPath]);
		if (ignored.size > 0) {
			this.trace(`Resource is git ignored: ${uri.toString()}`);
			return false;
		}
		return true;
	}
}

export class StagedResourceQuickDiffProvider extends AbstractGitQuickDiffProvider {
	readonly label = l10n.t('Git Local Changes (Index)');
	protected get originalRef(): string { return 'HEAD'; }

	constructor(
		private readonly _repository: Repository,
		logger: LogOutputChannel
	) {
		super(logger, '[StagedResourceQuickDiffProvider][provideOriginalResource]');
	}

	protected isCandidate(uri: Uri): boolean {
		// Ignore path that is inside a hidden repository
		if (this._repository.isHidden === true) {
			this.trace(`Repository is hidden: ${uri.toString()}`);
			return false;
		}
		return true;
	}

	protected isEligible(uri: Uri): boolean {
		// Ignore resources that are not in the index group
		if (!this._repository.indexGroup.resourceStates.some(r => pathEquals(r.resourceUri.fsPath, uri.fsPath))) {
			this.trace(`Resource is not part of a index group: ${uri.toString()}`);
			return false;
		}
		return true;
	}
}
