export declare const testJsonSchema: {
    description: string;
    properties: {
        apiVersion: {
            description: string;
            type: string[];
            default: string;
        };
        kind: {
            description: string;
            type: string[];
            enum: string[];
        };
        metadata: {
            description: string;
            properties: {
                lastTransitionTime: {
                    description: string;
                    format: string;
                    type: string[];
                    example: string;
                };
            };
            type: string[];
        };
    };
    type: string;
    $schema: string;
};
//# sourceMappingURL=json-schema.d.ts.map