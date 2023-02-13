import { TestGarden } from "../../../../../helpers";
import { ConfigGraph } from "../../../../../../src/graph/config-graph";
import { Garden } from "../../../../../../src";
export declare function getHelmTestGarden(): Promise<TestGarden>;
export declare function getHelmLocalModeTestGarden(): Promise<TestGarden>;
export declare function buildHelmModules(garden: Garden | TestGarden, graph: ConfigGraph): Promise<void>;
//# sourceMappingURL=common.d.ts.map