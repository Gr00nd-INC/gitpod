/**
 * Copyright (c) 2023 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License.AGPL.txt in the project root for license information.
 */

import { inject, injectable } from "inversify";
import { log } from "@gitpod/gitpod-protocol/lib/util/logging";
import {
    HeadlessUpdatesChannel,
    PrebuildUpdatesChannel,
    RedisHeadlessUpdate,
    RedisPrebuildUpdate,
    RedisWorkspaceInstanceUpdate,
    WorkspaceInstanceUpdatesChannel,
} from "@gitpod/gitpod-protocol";
import { Redis } from "ioredis";
import { reportUpdatePublished } from "../prometheus-metrics";

@injectable()
// RedisPublisher is a copy from ws-manager-bridge/src/redis/publisher.go until we find a better
// way to share the publisher across packages.
// WEB-621
export class RedisPublisher {
    constructor(@inject(Redis) private readonly client: Redis) {}

    async publishPrebuildUpdate(update: RedisPrebuildUpdate): Promise<void> {
        log.debug("[redis] Publish prebuild udpate invoked.");

        let err: Error | undefined;
        try {
            const serialized = JSON.stringify(update);
            await this.client.publish(PrebuildUpdatesChannel, serialized);
            log.debug("[redis] Succesfully published prebuild update.", update);
        } catch (e) {
            err = e;
            log.error("[redis] Failed to publish prebuild update.", e, update);
        } finally {
            reportUpdatePublished("prebuild", err);
        }
    }

    async publishInstanceUpdate(update: RedisWorkspaceInstanceUpdate): Promise<void> {
        let err: Error | undefined;
        try {
            const serialized = JSON.stringify(update);
            await this.client.publish(WorkspaceInstanceUpdatesChannel, serialized);
            log.debug("[redis] Succesfully published instance update.", update);
        } catch (e) {
            err = e;
            log.error("[redis] Failed to publish instance update.", e, update);
        } finally {
            reportUpdatePublished("workspace-instance", err);
        }
    }

    async publishHeadlessUpdate(update: RedisHeadlessUpdate): Promise<void> {
        log.debug("[redis] Publish headless udpate invoked.");

        let err: Error | undefined;
        try {
            const serialized = JSON.stringify(update);
            await this.client.publish(HeadlessUpdatesChannel, serialized);
            log.debug("[redis] Succesfully published headless update.", update);
        } catch (e) {
            err = e;
            log.error("[redis] Failed to publish headless update.", e, update);
        } finally {
            reportUpdatePublished("headless", err);
        }
    }
}
