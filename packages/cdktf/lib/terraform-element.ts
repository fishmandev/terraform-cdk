import { Construct } from "constructs";
import { Token } from ".";
import { TerraformStack } from "./terraform-stack";

export interface TerraformElementMetadata {
  readonly path: string;
  readonly uniqueId: string;
  readonly stackTrace: string[];
}

export class TerraformElement extends Construct {
  public readonly cdktfStack: TerraformStack;
  protected readonly rawOverrides: any = {};

  /**
   * An explicit logical ID provided by `overrideLogicalId`.
   */
  private _logicalIdOverride?: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    if (Token.isUnresolved(id)) {
      throw new Error(
        "You cannot use a Token (e.g. a reference to an attribute) as the id of a construct"
      );
    }

    this.node.addMetadata("stacktrace", "trace");
    this.cdktfStack = TerraformStack.of(this);
  }

  public toTerraform(): any {
    return {};
  }

  public toMetadata(): any {
    return {};
  }

  public get friendlyUniqueId() {
    if (this._logicalIdOverride) {
      return this._logicalIdOverride;
    } else {
      return this.cdktfStack.getLogicalId(this);
    }
  }

  /**
   * Overrides the auto-generated logical ID with a specific ID.
   * @param newLogicalId The new logical ID to use for this stack element.
   */
  public overrideLogicalId(newLogicalId: string) {
    this._logicalIdOverride = newLogicalId;
  }

  /**
   * Resets a previously passed logical Id to use the auto-generated logical id again
   */
  public resetOverrideLogicalId() {
    this._logicalIdOverride = undefined;
  }

  public addOverride(path: string, value: any) {
    const parts = path.split(".");
    let curr: any = this.rawOverrides;

    while (parts.length > 1) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const key = parts.shift()!;

      // if we can't recurse further or the previous value is not an
      // object overwrite it with an object.
      const isObject =
        curr[key] != null &&
        typeof curr[key] === "object" &&
        !Array.isArray(curr[key]);
      if (!isObject) {
        curr[key] = {};
      }

      curr = curr[key];
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const lastKey = parts.shift()!;
    curr[lastKey] = value;
  }

  protected get constructNodeMetadata(): { [key: string]: any } {
    return {
      metadata: {
        path: this.node.path,
        uniqueId: this.friendlyUniqueId,
        stackTrace: this.node.metadata.find((e) => e.type === "stacktrace")
          ?.trace,
      } as TerraformElementMetadata,
    };
  }
}
