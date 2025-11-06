'use client'
import { CartItem } from '@/interfaces/interfaces'
import Image from 'next/image'
import React, { useContext, useState } from 'react'
// import { cartContext } from '@/context/cartContext'
// import { wishListContext } from '@/context/wishListContext'
import { lifeyFont } from '../app/lib/fonts'


const CartItemSmall = ({item,wishListBool}:{item:CartItem,wishListBool:boolean}) => {
  const [quantity, setQuantity]=useState(item.quantity);

  // const handleQuantity=(opr:string,id:Number)=>{
  //   if(opr==='-'){
  //     if(quantity>1){
  //       const updatedQuantity = quantity-1
  //       setQuantity(updatedQuantity);
  //       if (wishListBool===true){
  //       const updatedWishList = wishList.map((item) =>
  //         item.id === id ? { ...item, quantity: updatedQuantity } : item
  //       );
  //       setWishList(updatedWishList);
  //     }
  //     else {
  //       const updatedCart = cart.map((item) =>
  //         item.id === id ? { ...item, quantity: updatedQuantity } : item
  //       );
  //       setCart(updatedCart);
  //     }
  //     }
  //   else if (quantity===1){
  //     deleteItem(item.productId,item.size,item.color)
  //   }
  //   }

  //   else if(opr==='+'){
  //     const updatedQuantity = quantity+1
  //     setQuantity(updatedQuantity);

  //     // Update the quantity in the global cart context
  //     const updatedCart = cart.map((item) =>
  //       item.id === id ? { ...item, quantity: updatedQuantity } : item
  //     );
  //     setCart(updatedCart);
  //   }
  // }
  const[modalAppear,toggleRemoveModal]=useState(false)
  // const {cart,setCart}=useContext(cartContext)
  // const {wishList,setWishList}=useContext(wishListContext)
//   const deleteItem =(id:string,size:string,color:string)=>{
//     console.log(id + size + color)
//     // console.log('currentCart' + cart[0].productId + cart[0].size + cart[0].color)
//    if(wishListBool){
//  const newWishList =wishList.filter((item)=>item.productId !== id);
//      setWishList(newWishList);
//     }
//     else {
//       const index = cart.findIndex(item =>
//         item.productId == id &&
//         item.size == size &&
//         item.color == color
//       );
      
//       if (index === -1){
//         console.log('Item not found in cart');
//         return; // Item not found
//       } 
      
//       const newCart = [
//         ...cart.slice(0, index),
//         ...cart.slice(index + 1)
//       ];
      
//       setCart(newCart);

//    }

//     }
  // const deleteItem =(id:Number)=>{
  //   const newWishList =wishList.filter((item)=>item.id !== id);
  //   setCart(newWishList);
  // }

  // const transferItemToCart =()=>{
  //   setCart((oldCart)=>([...oldCart,item]));

  // }
  


    return (
      <div className='text-primary border-2 border-primary rounded-2xl px-2 py-2'>

        <div className="flex w-full h-full  py-2  gap-4">
          {/* <div  className='cursor-pointer h-full flex justify-start items-start'><span onClick={()=>deleteItem(item.productId,item.size,item.color)} className='text-[12px] text-primary'>x</span></div> */}
        <div className='relative min-w-[80px] min-h-[80px]'>

        <Image
     fill
          src={item.imageUrl}
          alt=""
          className="size-16 rounded object-cover"
        />
        </div>
    
        <div className='flex w-full flex-col gap-2 justify-between '>
         <div>
         <h3 className={`${lifeyFont.className} font-semibold text-lg w-full `}>{item.productName}</h3>
          </div> 
          <div className='flex w-full  font-semibold text-xs  justify-between'> 
            <h3 className=''> Variant : {item.variant.name}</h3>
            <h3 className=''>{item.variant.attributeName} : {item.attributes.name}</h3>

          </div>
    
          <div className="mt-0.5 flex justify-between   font-semibold text-xs ">
            <div>
              QUANTITY : 
              {/* <dt className="inline">Quantity:</dt> */}
              {/* <span className='cursor-pointer' onClick={()=>handleQuantity('-',item.id)}>- </span> */}
           { item.quantity}
          {/* <span onClick={()=>handleQuantity('+',item.id)} className='cursor-pointer'> +</span> */}

            </div>
            <h3 className=''>PRICE : {item.price} LE</h3>

          </div>
            <div className='font-semibold flex justify-between w-full'>
           <h2 className='text-xs'> TOTAL :  {item.quantity*item.price} LE </h2>
         {/* {wishListBool && <h1   onClick={()=>{

           transferItemToCart(); // Properly invoke the function
           deleteItem(item.productId,item.color,item.size);  // Properly invoke with the item ID
         }
  }
           className='text-primary text-sm hover:cursor-pointer'>ADD TO CART</h1>} */}
            </div>
        </div>

      </div>
      
      </div>
      )
}

export default CartItemSmall