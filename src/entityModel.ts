import { ChildEntity, ChildEntityModel } from "./childEntity.ts";
import { ORMField } from "./ormField.ts";

const baseFields: ORMField[] = [
  {
    key: "id",
    label: "ID",
    fieldType: "IDField",
  },
  {
    key: "createdAt",
    label: "Created At",
    fieldType: "DateField",
  },
  {
    key: "updatedAt",
    label: "Updated At",
    fieldType: "DateField",
  },
];

export abstract class EntityModel {
  abstract label: string;
  abstract fields: ORMField[] & typeof baseFields;

  abstract children: ChildEntityModel[];
  private buildFields() {
    this.fields = [...baseFields, ...this.fields];
  }

  static entityId: string;

  constructor() {
    this.buildFields();
  }

  // private before save method not to be implemented by child classes
  async beforeSave() {
  }
  private async _beforeSave() {
    // do something before saving
    await this.beforeSave();
  }

  async beforeInsert() {
  }
  private async _beforeInsert() {
    // do something before inserting

    await this.beforeInsert();
  }

  async afterInsert() {
  }
  private async _afterInsert() {
    // do something after inserting
    await this.afterInsert();
  }

  async afterSave() {
  }

  private async _afterSave() {
    // do something after updating
    await this.afterSave();
  }

  async validate() {
    // validate fields
  }

  private async _validate() {
    // validate fields
    await this.validate();
  }

  protected async insert() {
    await this._validate();
    await this._beforeInsert();
    // insert
    await this._afterInsert();
  }
  protected async save() {
    await this._validate();
    await this._beforeSave();
    // save
    await this._afterSave();
  }
}
