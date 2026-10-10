import stylistic from '@stylistic/eslint-plugin';

const propertyNewline = stylistic.rules['object-property-newline'];

/** 复用 Stylistic 的属性换行修复，同时覆盖对象字面量和对象解构。 */
export default {
  meta: {
    ...propertyNewline.meta,
    defaultOptions: [{ minProperties: 4 }],
    schema: [
      {
        type: 'object',
        properties: {
          minProperties: { type: 'integer', minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const minProperties = context.options[0]?.minProperties ?? 4;
    const listeners = propertyNewline.create(context);
    function check(node) {
      if (node.properties.length >= minProperties) {
        listeners.ObjectExpression(node);
      }
    }
    return {
      ObjectExpression: check,
      ObjectPattern: check,
    };
  },
};
