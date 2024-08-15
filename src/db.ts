import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

prisma.$extends({
  name: "softDelete",
  query: {
    $allModels: {
      async delete({ model, operation, args, query }) {
        console.log({ model, operation, args, query });
        return query(args);
      },
      // deleteMany(params, next) {
      //   params.action = 'updateMany';
      //   if (params.args === undefined) {
      //     params.args = {};
      //   }
      //   if (params.args?.data !== undefined) {
      //     params.args.data.deleted = true;
      //     params.args.data.deletedAt = new Date();
      //   } else {
      //     params.args.data = { deleted: true, deletedAt: new Date() };
      //   }
      //   return next(params);
      // }
    },
  },
});

// prisma.$use((params, next) => {
//   // Check incoming query type
//   if (params.action == "delete") {
//     // Delete queries
//     // Change action to an update
//     params.action = "update";
//     params.args["data"] = { deleted: true, deletedAt: new Date() };
//   }
//   if (params.action == "deleteMany") {
//     // Delete many queries
//     params.action = "updateMany";
//     if (params.args === undefined) {
//       params.args = {};
//     }
//     if (params.args?.data !== undefined) {
//       params.args.data["deleted"] = true;
//       params.args.data["deletedAt"] = new Date();
//     } else {
//       params.args["data"] = { deleted: true, deletedAt: new Date() };
//     }
//   }

//   return next(params);
// });

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
