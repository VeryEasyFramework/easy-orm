import { defineEntity } from "../src/entity/defineEntity.ts";
import { DenoOrm } from "../src/orm.ts";

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

const campaign = defineEntity("campaign", {
  tableName: "campaigns_campaign",
  fields: [
    {
      key: "legacyCampaignId",
      label: "Legacy Campaign ID",
      fieldType: "BigIntField",
    },
    {
      key: "legacyFeedId",
      label: "Legacy Feed ID",
      fieldType: "BigIntField",
    },
    {
      key: "subIds",
      label: "Sub IDs",
      fieldType: "DataField",
    },
    {
      key: "channel",
      label: "Channel",
      fieldType: "DataField",
    },
    {
      key: "revenueShare",
      label: "Revenue Share",
      fieldType: "DataField",
    },
    {
      key: "isLive",
      label: "Is Live",
      fieldType: "BooleanField",
    },
    {
      key: "emails",
      label: "Emails",
      fieldType: "DataField",
    },
    {
      key: "launchedAt",
      label: "Launched At",
      fieldType: "DateField",
    },
    {
      key: "stoppedAt",
      label: "Stopped At",
      fieldType: "DateField",
    },
    {
      key: "notes",
      label: "Notes",
      fieldType: "DataField",
    },
    {
      key: "providerId",
      label: "Provider ID",
      fieldType: "DataField",
    },
    {
      key: "publisherId",
      label: "Publisher ID",
      fieldType: "DataField",
    },
    {
      key: "feedTagId",
      label: "Feed Tag ID",
      fieldType: "DataField",
    },
    {
      key: "lastEmailSentAt",
      label: "Last Email Sent At",
      fieldType: "DateField",
    },
    {
      key: "sendEmails",
      label: "Send Emails",
      fieldType: "DataField",
    },
    {
      key: "statsSentUntil",
      label: "Stats Sent Until",
      fieldType: "DataField",
    },
    {
      key: "direct",
      label: "Direct",
      fieldType: "DataField",
    },
    {
      key: "notifiedPublisher",
      label: "Notified Publisher",
      fieldType: "BooleanField",
    },
    {
      key: "notifiedPublisherAt",
      label: "Notified Publisher At",
      fieldType: "DateField",
    },
    {
      key: "alertMetricsStartDate",
      label: "Alert Metrics Start Date",
      fieldType: "DateField",
    },
    {
      key: "alertMetricsLastEndDate",
      label: "Alert Metrics Last End Date",
      fieldType: "DateField",
    },
    {
      key: "alertMetricsLastStartDate",
      label: "Alert Metrics Last Start Date",
      fieldType: "DateField",
    },
    {
      key: "createdById",
      label: "Created By ID",
      fieldType: "DataField",
    },
    {
      key: "pubNotes",
      label: "Pub Notes",
      fieldType: "DataField",
    },
    {
      key: "searchCap",
      label: "Search Cap",
      fieldType: "DataField",
    },
    {
      key: "updatedById",
      label: "Updated By ID",
      fieldType: "DataField",
    },
    {
      key: "wrappedUrl",
      label: "Wrapped URL",
      fieldType: "DataField",
    },
    {
      key: "statusId",
      label: "Status ID",
      fieldType: "DataField",
    },
    {
      key: "statusReasonId",
      label: "Status Reason ID",
      fieldType: "DataField",
    },
    {
      key: "campaignType",
      label: "Campaign Type",
      fieldType: "DataField",
    },
  ],
  label: "Campaign",
  hooks: {
    async beforeSave() {
    },
  },
  actions: {
    async sendEmail(email: string) {
      console.log(`Sending email to ${email}`);
      console.log(this.emails);
    },
  },
});

const orm = new DenoOrm({
  entities: [user, campaign],
  databaseType: "postgres",
  databaseConfig: {
    size: 10,
    lazy: true,
    camelCase: true,
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

// // const users = await orm.getEntityList("user");
// const campaigns = await orm.getEntityList("campaign", {
//   filter: {
//     isLive: true,
//   },
// });
const camp = await orm.getEntity("campaign", "3876");
const res = await camp.sendEmail("john@smith.com");
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
