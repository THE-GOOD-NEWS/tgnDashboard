type ShippingZone = {
    zoneID: number;
    zoneName: string
    localGlobal: string;
    zoneRate: number;
  };

  type Country = {
    id: number; // or string, depending on your data
    name: string;
    shipping_zone:number; // other properties, if any
  };
  

// type category={id:string,
//     categoryName:string,
//     imageURL:string
// }

// type subCategory={
//     id:string, 
//     subCategoryName:string,
//     categoryId:string,
//     imageURL:string
// }
