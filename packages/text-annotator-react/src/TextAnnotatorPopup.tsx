import {ReactNode, useCallback, useEffect, useState, PointerEvent} from 'react';
import {useAnnotator, useSelection} from '@annotorious/react';
import {type TextAnnotation, type TextAnnotator} from '@recogito/text-annotator';
import {
    autoUpdate,
    inline,
    offset,
    flip,
    shift,
    useDismiss,
    useFloating,
    useInteractions,
    useRole
} from '@floating-ui/react';

interface TextAnnotationPopupProps {

    popup(props: TextAnnotatorPopupProps): ReactNode;

    openOnAnnotation?: boolean;
    openClick?: boolean;
    onClose?: () => void;
    onAnnotationClick?: () => void;

}

export interface TextAnnotatorPopupProps {

    selected: { annotation: TextAnnotation, editable?: boolean }[];
    onClose?: () => void;
    onAnnotationClick?: () => void;

}

export const TextAnnotatorPopup = (
    {
        popup,
        openOnAnnotation = true,
        openClick = false,
        onClose = () => {},
        onAnnotationClick = () => {}
    }: TextAnnotationPopupProps
) => {

    const annotator = useAnnotator<TextAnnotator>();

    const {selected, event} = useSelection<TextAnnotation>();

    const annotation = selected[0]?.annotation;

    const [isOpen, setOpen] = useState(openOnAnnotation && selected?.length > 0);

    const {refs, floatingStyles, update, context} = useFloating({
        placement: 'top',
        open: isOpen,
        onOpenChange: (open, _event, reason) => {
            setOpen(open);

            if (!open && !annotation) {
                onClose();
                annotator?.cancelSelected();
            }

            if (!open && reason === 'escape-key') {
                onClose();
                annotator?.cancelSelected();
            }
        },
        middleware: [
            offset(10),
            inline(),
            flip(),
            shift({mainAxis: false, crossAxis: true, padding: 10})
        ],
        whileElementsMounted: autoUpdate
    });

    const dismiss = useDismiss(context);

    const role = useRole(context, {role: 'tooltip'});

    const {getFloatingProps} = useInteractions([dismiss, role]);

    const selectedKey = selected.map(a => a.annotation.id).join('-');

    useEffect(() => {
        // Ignore all selection changes except those accompanied by a pointer event.
        if (event) {
            const hasAnnotation = selected.length > 0 && event.type === 'pointerup';
            if (hasAnnotation && annotator.isAnnotationClick() && !openOnAnnotation) {
                onAnnotationClick();
            }

            setOpen(openOnAnnotation && hasAnnotation);
        }
    }, [event?.type, selectedKey]);

    useEffect(() => {
        if (!isOpen || !annotation) return;

        const {
            target: {
                selector: [{range}]
            }
        } = annotation;

        refs.setPositionReference({
            getBoundingClientRect: range.getBoundingClientRect.bind(range),
            getClientRects: range.getClientRects.bind(range)
        });
    }, [isOpen, annotation, refs]);

    useEffect(() => {
        setOpen(!openOnAnnotation && openClick);
    }, [openClick]);

    // Prevent text-annotator from handling the irrelevant events triggered from the popup
    const getStopEventsPropagationProps = useCallback(
        () => ({
            onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
                event.stopPropagation();
            }
        }),
        []
    );

    useEffect(() => {
        const config: MutationObserverInit = {attributes: true, childList: true, subtree: true};

        const mutationObserver = new MutationObserver(() => update());
        mutationObserver.observe(document.body, config);

        window.document.addEventListener('scroll', update, true);

        return () => {
            mutationObserver.disconnect();
            window.document.removeEventListener('scroll', update, true);
        }
    }, [update]);

    return isOpen && selected.length > 0 ? (
        <div
            className="annotation-popup text-annotation-popup not-annotatable"
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            {...getStopEventsPropagationProps()}>
            {popup({selected, onClose, onAnnotationClick})}
        </div>
    ) : null;

}
