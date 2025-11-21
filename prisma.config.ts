const datasource = {
  provider: "postgresql",
  url: process.env.DATABASE_URL,
  directUrl: process.env.DIRECT_URL,
};

export default {
  schema: "./prisma/schema.prisma",
  datasource,
};
