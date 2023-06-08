import { useEffect, useRef, useState } from 'react';
import { TextAnnotation } from '@recogito/text-annotator';
import { Draggable, useSelection } from '@annotorious/react';

export interface TextAnnotatorPopupProps {

}

export const TextAnnotatorPopup = (props: TextAnnotatorPopupProps) => {

  const el = useRef<HTMLDivElement>(null);

  const selection = useSelection<TextAnnotation>();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [dragged, setDragged] = useState(false);

  const onDragStart = () => setDragged(true);

  const updatePosition = () => {
    /*
    // Note: this popup only supports a single selection
    const annotation = selection[0];

    const { minX, minY, maxX, maxY } = annotation.target.selector.geometry.bounds;

    const PADDING = 14;

    const topLeft = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(minX, minY));
    const bottomRight = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(maxX, maxY));

    el.current.style.left = `${bottomRight.x + PADDING}px`;
    el.current.style.top = `${topLeft.y}px`;
    */
  }

  const equal = (a: string[], b: string[]) => 
    a.every(str => b.includes(str)) && b.every(str => a.includes(str));

  useEffect(() => {
    console.log('Selection: ', selection);
    
    // Reset drag flag if selected IDs have changed
    const nextIds = selection.map(a => a.id);

    if (!equal(selectedIds, nextIds)) {
      setDragged(false);
      setSelectedIds(nextIds);
    }
  }, [selection]);

  useEffect(() => {
    if (!el.current) return;

    if (!dragged) updatePosition();
  }, [selection, dragged]);
  
  return selection.length > 0 ? (
    <Draggable ref={el} key={selection.map(a => a.id).join('-')} className="a9s-popup a9s-osd-popup" onDragStart={onDragStart}>
      
    </Draggable>
  ) : null;

}