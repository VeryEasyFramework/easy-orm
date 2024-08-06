import { defineEntity } from "../src/entity/defineEntity.ts";
import { EasyOrm } from "../src/orm.ts";

// "id",
// "password",
// "lastLogin",
// "isSuperuser",
// "email",
// "name",
// "isStaff",
// "isActive",
// "dateJoined"

const user = defineEntity("user", {
  tableName: "users_user",
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
    key: "isStaff",
    label: "Is Staff",
    fieldType: "BooleanField",
  }, {
    key: "isActive",
    label: "Is Active",
    fieldType: "BooleanField",
  }, {
    key: "isSuperuser",
    label: "Is Superuser",
    fieldType: "BooleanField",
  }, {
    key: "lastLogin",
    label: "Last Login",
    fieldType: "DateField",
  }, {
    key: "dateJoined",
    label: "Date Joined",
    fieldType: "DateField",
  }],
  label: "User",
  hooks: {
    async beforeSave() {
      console.log("Before Save");
      this.sayHello();
    },
  },
  actions: {
    async sayHello() {
      console.log("Hello");
    },
  },
});

// const orm = new DenoOrm({
//   entities: [user, campaign],
//   databaseType: "postgres",
//   databaseConfig: {
//     size: 1,
//     lazy: true,
//     camelCase: true,
//     clientOptions: {
//       user: "eliveffer",
//       // password: "uniueq23",
//       database: "verax",
//       unixPath: "/var/run/postgresql/.s.PGSQL.5432",
//       // host: "localhost",
//       // port: 5432,
//     },
//   },
// });

// const orm = new DenoOrm({
//   databaseType: "memcached",
//   entities: [user],
//   databaseConfig: {
//     port: 11211,
//     poolSize: 10,
//   },
// });
const orm = new EasyOrm({
  databaseType: "json",
  entities: [user],
  databaseConfig: {
    dataPath: "./data",
  },
});

await orm.init();

await orm.createEntity("user", {
  name: "John Smith",
  isActive: true,
});

// await orm.updateEntity("user", "K7PEoqprvZItewBn", {
//   isActive: false,
// });

// const userj = await orm.getEntity("user", "K7PEoqprvZItewBn");

// console.log(userj);
const users = await orm.getEntityList("user");

console.log(users);
// const campaigns = await orm.getEntityList("campaign", {
//   filter: {
//     isLive: true,
//   },
// });
// const camp = await orm.getEntity("campaign", "3876");
// const camp2 = await orm.getEntity("campaign", "3877");
// const res = await camp.sendEmail("john@smith.com");
// await camp2.sendEmail("jane@fmailcom");
// const { rowCount, columns, data } = campaigns;
// console.log(rowCount);
// console.log(columns);
// console.log(data.length);
// console.log(data);

// console.table(data, columns);
// console.log(camp);
// for (const key in firstCampaign) {
//   console.log(`${key}: ${firstCampaign[key]}`);
// }

// console.log(user.entityClass.prototype);
