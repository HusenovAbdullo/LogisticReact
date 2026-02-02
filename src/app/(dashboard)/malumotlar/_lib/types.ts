export type EntityBase = {
  id: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type Admin = EntityBase & {
  fullName: string;
  phone?: string;
  email?: string;
  role: "SuperAdmin" | "Admin";
  status: "active" | "blocked";
};

export type Employee = EntityBase & {
  fullName: string;
  phone?: string;
  position?: string;
  office?: string;
  status: "active" | "inactive";
};

export type User = EntityBase & {
  fullName: string;
  phone?: string;
  type: "sender" | "receiver";
  address?: string;
  status: "active" | "blocked";
};

export type Shop = EntityBase & {
  name: string;
  owner?: string;
  phone?: string;
  address?: string;
  status: "active" | "inactive";
};

export type Warehouse = EntityBase & {
  name: string;
  manager?: string;
  phone?: string;
  address?: string;
  status: "active" | "inactive";
};

export type Office = EntityBase & {
  name: string;
  manager?: string;
  phone?: string;
  address?: string;
  status: "active" | "inactive";
};

export type Country = EntityBase & { name: string; code?: string };
export type Region = EntityBase & { countryId: string; name: string };
export type District = EntityBase & { regionId: string; name: string };
export type Locality = EntityBase & { districtId: string; name: string; kind?: "mahalla" | "qishloq" | "kocha" };

export type HududState = {
  countries: Country[];
  regions: Region[];
  districts: District[];
  localities: Locality[];
};
