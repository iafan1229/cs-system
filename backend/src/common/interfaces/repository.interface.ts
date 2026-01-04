export interface IRepository<T, CreateDto, UpdateDto> {
  findAll(where?: any): Promise<T[]>;
  findOne(id: number, where?: any): Promise<T | null>;
  create(data: CreateDto): Promise<T>;
  update(id: number, data: UpdateDto): Promise<T>;
  delete(id: number): Promise<void>;
  count(where?: any): Promise<number>;
}
