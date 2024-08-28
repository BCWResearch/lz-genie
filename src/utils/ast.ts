import { ObjectExpression, Property, Expression, Literal, Identifier, MemberExpression, LogicalExpression } from '@typescript-eslint/types/dist/generated/ast-spec';

export class ASTUtils {
    static extractProperties(
        objectExpression: ObjectExpression
    ): { [key: string]: any } {
        const result: { [key: string]: any } = {};

        try {
            objectExpression?.properties?.forEach((property: Property) => {
                try {
                    // Handle Property node (key-value pair)
                    if (property?.type === 'Property') {
                        const key = this.getKeyFromProperty(property);
                        if (!key) return;

                        const valueNode = property.value;
                        if (valueNode?.type === 'ObjectExpression') {
                            // Recursively parse nested ObjectExpressions
                            result[key] = this.extractProperties(valueNode as ObjectExpression);
                        } else {
                            result[key] = this.getTextFromNode(valueNode as Expression) || '';
                        }
                    }
                } catch (e) {
                    console.error('Error processing property:', e);
                }
            });
        } catch (e) {
            console.error('Error extracting properties from ObjectExpression:', e);
        }

        return result;
    }

    static getKeyFromProperty(property: Property): string | undefined {
        try {
            // Handles different types of keys (Identifier, Literal, etc.)
            if (property?.key?.type === 'Identifier') {
                return (property.key as Identifier).name;
            } else if (property?.key?.type === 'Literal') {
                return String((property.key as Literal).value);
            }
        } catch (e) {
            console.error('Error getting key from property:', e);
        }
        // Return undefined if the key is not an Identifier or a Literal
        return undefined;
    }

    static getTextFromNode(node: Expression): string | undefined {
        try {
            if (node?.type === 'Literal') {
                return String((node as Literal).value);
            } else if (node?.type === 'Identifier') {
                return (node as Identifier).name;
            } else if (node?.type === 'MemberExpression') {
                return this.getMemberExpressionString(node as MemberExpression);
            } else if (node?.type === 'LogicalExpression') {
                return this.getLogicalExpressionString(node as LogicalExpression);
            }
        } catch (e) {
            console.error('Error getting text from node:', e);
        }
        // Return undefined if the node type is not handled
        return undefined;
    }

    static getLogicalExpressionString(logicalExpression: LogicalExpression): string {
        try {
            const left = this.getTextFromNode(logicalExpression.left) || '';
            const right = this.getTextFromNode(logicalExpression.right) || '';
            const operator = logicalExpression.operator; // This will be '||', '&&', etc.

            return `${left} ${operator} ${right}`;
        } catch (e) {
            console.error('Error processing LogicalExpression:', e);
            return '';
        }
    }

    static getMemberExpressionString(memberExpression: MemberExpression): string {
        try {
            const object = memberExpression.object;
            const property = memberExpression.property;

            let objectText = '';
            let propertyText = '';

            // Recursively resolve the object part of the MemberExpression
            if (object?.type === 'MemberExpression' || object?.type === 'Identifier') {
                objectText = this.getTextFromNode(object as Expression) || '';
            }

            // Handle property part (it could be an identifier or a literal)
            if (property?.type === 'Identifier') {
                propertyText = (property as Identifier).name;
            } else if (property?.type === 'Literal') {
                propertyText = String((property as Literal).value);
            }

            // Combine the object and property parts with a dot (.)
            return `${objectText}.${propertyText}`;
        } catch (e) {
            console.error('Error processing MemberExpression:', e);
            return '';
        }
    }
}
