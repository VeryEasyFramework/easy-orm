import type {
  EasyFieldType,
  EasyFieldTypeMap,
} from "#/entity/field/fieldTypes.ts";

/**
 * The choice definition for a field that's set to `ChoicesField` or `MultiChoiceField`.
 */
interface Choice {
  key: string | number;
  label: string;
  color?:
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "error"
    | "muted";
}

/**
 * The connected entity definition for a field that's set to `ConnectionField`.
 */

export interface FetchOptions {
  fetchEntity: string; // entity name
  thisIdKey: string; // local id key
  thisFieldKey: string; // local field key
  thatFieldKey: string; // foreign field key
}

/**
 * The field definition for a field in an entity.
 */
export interface EasyField {
  /**
   * The key of the field. This is how the field will be accessed in the entity.
   */
  key: string;

  /**
   * The label of the field. This is how the field will be displayed in the UI.
   */
  label?: string;

  /**
   * The description of the field. This is how the field will be described in the UI.
   */
  description?: string;

  /**
   * Whether the field is required.
   */
  required?: boolean;
  /**
   * Set to true if the field should be read-only and not editable by the user.
   */
  readOnly?: boolean;
  /**
   * The type of the field.
   *
   * **DataField**: Short text data. Limited to 255 characters.
   *
   * **IntField**: Integer.
   *
   * **BigIntField**: BigInt.
   *
   * **DecimalField**: Decimal.
   *
   * **DateField**: Date.
   *
   * **TimestampField**: Date and time.
   *
   * **BooleanField**: Boolean.
   *
   * **ChoicesField**: Single choice.
   *
   * **MultiChoiceField**: Multiple choices.
   *
   * **TextField**: Long text data.
   *
   * **EmailField**: Email.
   *
   * **ImageField**: Image URL.
   *
   * **JSONField**: JSON object.
   *
   * **PhoneField**: Phone number.
   *
   * **ConnectionField**: Connection to another entity.
   *
   * **PasswordField**: Password.
   *
   * **IDField**: ID.
   */
  fieldType: EasyFieldType;

  /**
   * Set to true if the field is the primary key of the entity.
   */
  primaryKey?: boolean;

  /**
   * The fetch options for the field. Only applicable for ConnectionField.
   */
  fetchOptions?: FetchOptions;

  /**
   * Set to true if the field should be included in the default list view.
   */
  inList?: boolean;

  /**
   * The choices for the field. Only applicable for ChoicesField and MultiChoiceField.
   */
  choices?: Choice[];

  /**
   * The default value of the field. Can be a value or a function that returns a value.
   */
  defaultValue?:
    | EasyFieldTypeMap[EasyFieldType]
    | (() => EasyFieldTypeMap[EasyFieldType]);

  connectionEntity?: string;

  connectionIdType?: EasyFieldType;

  connectionTitleField?: string;

  /**
   * Set to true if the field should be unique.
   */
  unique?: boolean;

  /**
   * Set to true if the field should be hidden in the UI.
   */
  hidden?: boolean;

  /**
   * The group that the field belongs to.
   */
  group?: string;

  inCreate?: boolean;
}
