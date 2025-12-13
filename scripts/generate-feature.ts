import fs from 'fs';
import path from 'path';

const name = process.argv[2];
if (!name) {
  console.error('❌ Error: Feature name is required');
  console.log('Usage: pnpm generate:feature <feature-name>');
  process.exit(1);
}

// Validate feature name (kebab-case or camelCase)
if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error('❌ Error: Feature name must be in kebab-case (e.g., user-profile, chat)');
  process.exit(1);
}

const root = path.join(process.cwd(), 'src', 'features', name);
const pascalName = name
  .split('-')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join('');
const camelName = name.split('-').map((word, i) => 
  i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
).join('');

// Directories to create
const dirs = [
  'controller',
  'service',
  'repository',
  'route',
  'dto',
  'validation',
  'type',
];

// Create directories
dirs.forEach((d) => {
  const dirPath = path.join(root, d);
  if (fs.existsSync(dirPath)) {
    console.warn(`⚠️  Warning: Directory ${d} already exists, skipping...`);
  } else {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✓ Created directory: ${d}/`);
  }
});

const write = (p: string, c: string) => {
  if (fs.existsSync(p)) {
    console.warn(`⚠️  Warning: File ${p} already exists, skipping...`);
    return;
  }
  fs.writeFileSync(p, c);
  console.log(`✓ Created file: ${path.relative(process.cwd(), p)}`);
};

// Index file
write(
  path.join(root, 'index.ts'),
  [
    `export * from './type/${name}.type';`,
    `export * from './validation/${name}.validations';`,
    `export * from './dto/${name}.dto';`,
    `export * from './repository/${name}.repository';`,
    `export * from './service/${name}.service';`,
    `export * from './controller/${name}.controller';`,
    `export * from './route/${name}s.routes';`,
  ].join('\n'),
);

// Type file
write(
  path.join(root, 'type', `${name}.type.ts`),
  `import { IdentifiableType, TimestampType, ActiveType } from '@/types';
export interface ${pascalName}Type extends IdentifiableType, TimestampType, ActiveType {
  // Add your fields here
}
`
);

// DTO file
write(
  path.join(root, 'dto', `${name}.dto.ts`),
  `import { ${pascalName}Type } from '@/features/${name}/type/${name}.type';

export class ${pascalName}Dto {
  /**
   * Converts a single ${pascalName}Type instance to the response format.
   */
  static toResponse(data: ${pascalName}Type) {
    return {
      ...data,
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  /**
   * Converts an array of ${pascalName}Type to a response array.
   */
  static toListResponse(data: ${pascalName}Type[]) {
    return data.map((item) => this.toResponse(item));
  }

  /**
   * Converts a partial/possibly undefined object to a response shape (or null).
   */
  static toNullableResponse(data: ${pascalName}Type | null | undefined) {
    return data ? this.toResponse(data) : null;
  }
}
`
);

// Validation file
write(
  path.join(root, 'validation', `${name}.validations.ts`),
  `import { z } from 'zod';
import { querySchema, commonSchemas } from '@/validations';
export const create${pascalName}Schema = z.object({
  // Add your validation schema here
  // Example: name: z.string().min(1).max(100),
});

export const update${pascalName}Schema = z.object({
  // Add your validation schema here
});

export const list${pascalName}Schema = querySchema.extend({
  // Add your validation schema here
});

export const ${pascalName}IdSchema = z.object({
  id: commonSchemas.objectId,
});
export type ${pascalName}IdInput = z.infer<typeof ${pascalName}IdSchema>;
export type Create${pascalName}Input = z.infer<typeof create${pascalName}Schema>;
export type Update${pascalName}Input = z.infer<typeof update${pascalName}Schema>;
export type List${pascalName}Input = z.infer<typeof list${pascalName}Schema>;
`
);

// Repository file
write(
  path.join(root, 'repository', `${name}.repository.ts`),
  `import {
  Create${pascalName}Input,
  Update${pascalName}Input,
  ${pascalName}IdInput,
  List${pascalName}Input,
} from '@/features/${name}/validation/${name}.validations';
import { ${pascalName}Type } from '@/features/${name}/type/${name}.type';
import { prisma } from '@/config';

export class ${pascalName}Repository {
   static async create(payload: Create${pascalName}Input): Promise<${pascalName}Type> {
    return prisma.${camelName}.create({ data: payload });
  }
  
  static async findById(id: ${pascalName}IdInput['id']): Promise<${pascalName}Type | null> {
    return prisma.${camelName}.findUnique({ where: { id } });
  }
  
  static async update(id: ${pascalName}IdInput['id'], payload: Update${pascalName}Input): Promise<${pascalName}Type> {
    return prisma.${camelName}.update({ where: { id }, data: payload });
  }
  
  static async delete(id: ${pascalName}IdInput['id']): Promise<void> {
    await prisma.${camelName}.delete({ where: { id } });
  }

  static async list(payload: List${pascalName}Input): Promise<${pascalName}Type[]> {
    return prisma.${camelName}.findMany({ where: payload });
  }
}
`
);

// Service file
write(
  path.join(root, 'service', `${name}.service.ts`),
  `import { ${pascalName}Repository } from '@/features/${name}/repository/${name}.repository';
import {
  Create${pascalName}Input,
  Update${pascalName}Input,
  ${pascalName}IdInput,
  List${pascalName}Input,
} from '@/features/${name}/validation/${name}.validations';
import { ${pascalName}Dto } from '@/features/${name}/dto/${name}.dto';
import { AppError } from '@/utils';

export class ${pascalName}Service {
  static async create(payload: Create${pascalName}Input) {
    const result = await ${pascalName}Repository.create(payload);
    return ${pascalName}Dto.toResponse(result);
  }

  static async findById(id: ${pascalName}IdInput['id']) {
    const result = await ${pascalName}Repository.findById(id);
    if (!result) throw new AppError('Not found', 404);
    return ${pascalName}Dto.toResponse(result);
  }

  static async update(id: ${pascalName}IdInput['id'], payload: Update${pascalName}Input) {
    const result = await ${pascalName}Repository.update(id,payload);
    return ${pascalName}Dto.toResponse(result);
  }

  static async delete(id: ${pascalName}IdInput['id']) {
    await ${pascalName}Repository.delete(id);
  }

  static async list(payload: List${pascalName}Input) {
    const results = await ${pascalName}Repository.list(payload);
    return ${pascalName}Dto.toListResponse(results);
  }
}
`
);

// Controller file
write(
  path.join(root, 'controller', `${name}.controller.ts`),
  `import { Response } from 'express';
import { ${pascalName}Service } from '@/features/${name}/service/${name}.service';
import { Res, catchAsync } from '@/utils';
import {
  Create${pascalName}Input,
  Update${pascalName}Input,
  ${pascalName}IdInput,
  List${pascalName}Input,
} from '@/features/${name}/validation/${name}.validations';
import { TypedRequest } from '@/types';

export class ${pascalName}Controller {
  static create = catchAsync(async (req: TypedRequest<unknown, Create${pascalName}Input>, res: Response) => {
    const data = await ${pascalName}Service.create(req.body);
    return Res.success(res, { ${camelName}: data }, '${camelName} created successfully');
  });

  static findById = catchAsync(async (req: TypedRequest<${pascalName}IdInput>, res: Response) => {
    const { id } = req.params;
    const data = await ${pascalName}Service.findById(id);
    return Res.success(res, { ${camelName}: data });
  });

  static update = catchAsync(
    async (
      req: TypedRequest<unknown, Update${pascalName}Input, { id: ${pascalName}IdInput['id'] }>,
      res: Response,
    ) => {
      const { id } = req.params;
      const data = await ${pascalName}Service.update(id, req.body);
      return Res.success(res, { ${camelName}: data }, '${camelName} updated successfully');
    },
  );

  static delete = catchAsync(
    async (req: TypedRequest<unknown, unknown, { id: ${pascalName}IdInput['id'] }>, res: Response) => {
      const { id } = req.params;
      await ${pascalName}Service.delete(id);
      return Res.success(res, { ${camelName}: null }, '${camelName} deleted successfully');
    },
  );

  static list = catchAsync(async (req: TypedRequest<List${pascalName}Input>, res: Response) => {
    const data = await ${pascalName}Service.list(req.query);
    return Res.success(res, { ${camelName}s: data });
  });
}
`
);

// Route file
/**
 * ${pascalName} Express Router
 *
 * Defines REST endpoints for the ${pascalName} resource. Uses schema validation
 * with zod's .object({ body, query }) for appropriate request validation.
 *
 * Available Endpoints:
 *   - POST   /        - Create a new ${pascalName}
 *   - GET    /        - List ${pascalName}s
 *   - GET    /:id     - Retrieve a ${pascalName} by ID
 *   - PUT    /:id     - Update a ${pascalName}
 *   - DELETE /:id     - Delete a ${pascalName}
 */

write(
  path.join(root, 'route', `${name}s.routes.ts`),
  `import { Router } from 'express';
import { ${pascalName}Controller } from '@/features/${name}/controller/${name}.controller';
import { validate, idempotency } from '@/middlewares';
import { 
  create${pascalName}Schema, 
  update${pascalName}Schema, 
  list${pascalName}Schema, 
  findById${pascalName}Schema 
} from '@/features/${name}/validation/${name}.validations';
import { z } from 'zod';

export const ${camelName}Router = Router();
/**
 * @route POST /
 * @desc Create a new ${pascalName}
 */
${camelName}Router.post(
  '/',
  validate(z.object({ body: create${pascalName}Schema })),
  idempotency('${pascalName}Create'),
  ${pascalName}Controller.create
);

/**
 * @route GET /
 * @desc List all ${pascalName}s
 */
${camelName}Router.get(
  '/',
  validate(z.object({ query: list${pascalName}Schema })),
  ${pascalName}Controller.list
);

/**
 * @route GET /:id
 * @desc Retrieve a ${pascalName} by ID
 */
${camelName}Router.get(
  '/:id',
  validate(z.object({ query: findById${pascalName}Schema })),
  ${pascalName}Controller.findById
);

/**
 * @route PUT /:id
 * @desc Update a ${pascalName} by ID
 */
${camelName}Router.put(
  '/:id',
  validate(z.object({ body: update${pascalName}Schema })),
  idempotency('${pascalName}Update'),
  ${pascalName}Controller.update
);

/**
 * @route DELETE /:id
 * @desc Delete a ${pascalName} by ID
 */
${camelName}Router.delete(
  '/:id',
  ${pascalName}Controller.delete
);

export default ${camelName}Router;
`
);


console.log(`\n✅ Feature "${name}" generated successfully!`);
console.log(`\n📁 Location: src/features/${name}/`);
console.log(`\n📝 Next steps:`);
console.log(`   1. Update the types in type/${name}.type.ts`);
console.log(`   2. Add validation schemas in validation/${name}.validations.ts`);
console.log(`   3. Implement repository methods in repository/${name}.repository.ts`);
console.log(`   4. Add business logic in service/${name}.service.ts`);
console.log(`   5. Register routes in src/routes/index.ts`);
console.log(`\n💡 Example: import { ${camelName}Router } from '@/features/${name}/route/${name}s.routes';`);