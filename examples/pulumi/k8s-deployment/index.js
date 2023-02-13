"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const pulumi = __importStar(require("@pulumi/pulumi"));
const k8s = __importStar(require("@pulumi/kubernetes"));
// Minikube does not implement services of type `LoadBalancer`; require the user to specify if we're
// running on minikube, and if so, create only services of type ClusterIP.
const config = new pulumi.Config();
const isMinikube = config.requireBoolean("isMinikube");
const appName = config.require("appName");
const orgName = config.require("orgName");
const stackRef = new pulumi.StackReference(`${orgName}/pulumi-k8s/k8s-namespace`);
const namespace = stackRef.getOutput("namespace");
const appLabels = { app: appName };
const deployment = new k8s.apps.v1.Deployment(appName, {
    metadata: { namespace, labels: appLabels },
    spec: {
        selector: { matchLabels: appLabels },
        replicas: 1,
        template: {
            metadata: { labels: appLabels },
            spec: { containers: [{ name: appName, image: "nginx" }] }
        }
    }
});
// Allocate an IP to the Deployment.
new k8s.core.v1.Service(appName, {
    metadata: { labels: deployment.spec.template.metadata.labels, namespace },
    spec: {
        type: isMinikube ? "ClusterIP" : "LoadBalancer",
        ports: [{ port: 80, targetPort: 80, protocol: "TCP" }],
        selector: appLabels
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdURBQXlDO0FBQ3pDLHdEQUEwQztBQUUxQyxvR0FBb0c7QUFDcEcsMEVBQTBFO0FBQzFFLE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ25DLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDdkQsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQTtBQUN6QyxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBRXpDLE1BQU0sUUFBUSxHQUFHLElBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLE9BQU8sMkJBQTJCLENBQUMsQ0FBQTtBQUVqRixNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBRWxELE1BQU0sU0FBUyxHQUFHLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxDQUFDO0FBRW5DLE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRTtJQUNuRCxRQUFRLEVBQUUsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRTtJQUMxQyxJQUFJLEVBQUU7UUFDRixRQUFRLEVBQUUsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFO1FBQ3BDLFFBQVEsRUFBRSxDQUFDO1FBQ1gsUUFBUSxFQUFFO1lBQ04sUUFBUSxFQUFFLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRTtZQUMvQixJQUFJLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUU7U0FDNUQ7S0FDSjtDQUNKLENBQUMsQ0FBQztBQUVILG9DQUFvQztBQUNwQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7SUFDN0IsUUFBUSxFQUFFLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFO0lBQ3pFLElBQUksRUFBRTtRQUNGLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsY0FBYztRQUMvQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDdEQsUUFBUSxFQUFFLFNBQVM7S0FDdEI7Q0FDSixDQUFDLENBQUMifQ==