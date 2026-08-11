import { useRef } from "react";


export default function ResizeHandle({
  onResize
}:{
  onResize:(height:number)=>void
}) {


  const dragging = useRef(false);


  const startDrag = () => {

    dragging.current = true;


    const move = (e:MouseEvent)=>{

      if(!dragging.current) return;


      const height =
        window.innerHeight - e.clientY - 80;


      if(height > 80 && height < 600){
        onResize(height);
      }

    };


    const stop = ()=>{

      dragging.current = false;

      window.removeEventListener(
        "mousemove",
        move
      );

      window.removeEventListener(
        "mouseup",
        stop
      );

    };


    window.addEventListener(
      "mousemove",
      move
    );


    window.addEventListener(
      "mouseup",
      stop
    );

  };


  return (

    <div
      onMouseDown={startDrag}
      className="
      h-1
      w-full
      cursor-row-resize
      hover:bg-purple-300
      transition
      "
    />

  );

}