export class NetworkId {
  name = this.constructor.name;

  constructor(
    public id: number,
  ) {}
}

// * Required to generate code
export default NetworkId.name;
