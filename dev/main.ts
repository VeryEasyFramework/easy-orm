import { defineEntity } from "../src/entity/defineEntity.ts";
import { DenoOrm } from "../src/orm.ts";

const user = defineEntity("user", {
  fields: [{
    key: "name",
    label: "Full Name",
    fieldType: "DataField",
  }, {
    key: "email",
    label: "Email",
    fieldType: "DataField",
  }, {
    key: "password",
    label: "Password",
    fieldType: "PasswordField",
  }, {
    key: "isActive",
    label: "Is Active",
    fieldType: "BooleanField",
  }],
  label: "User",
  hooks: {
    async beforeSave() {
    },
  },
});

const campaign = defineEntity("campaign", {
  fields: [{
    key: "campaignName",
    label: "Campaign Name",
    fieldType: "DataField",
  }],
  label: "Campaign",
  hooks: {
    async beforeSave() {
    },
  },
  actions: {
    async sendEmail(email: string) {
    },
  },
});

const orm = new DenoOrm({
  entities: [user, campaign],
  databaseType: "postgres",
  databaseConfig: {
    size: 10,
    lazy: true,
    connection_params: {
      user: "eliveffer",
      password: "uniueq23",
      applicationName: "deno-orm",
      tls: {
        enabled: false,
      },
      database: "verax",
      host_type: "tcp",
      port: 5432,
    },
  },
});

orm.init();

console.log(user);
const userEntity = orm.getEntity("user", "123");
const userList = orm.getEntityList("user");
const campaignEntity = orm.getEntity("campaign", "123");
const campaignList = orm.getEntityList("campaign");
for (const u of userList) {
}
for (const c of campaignList) {
  c.campaignName;
}

// console.log(user.entityClass.prototype);
