import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

/*
 * AxisHoverLine for axis hover
 *
 * @class AxisHoverLine
 * @extends PureComponent
 */
class AxisHoverLine extends PureComponent {
  render() {
    const {
      activeLayers,
      axisWidth,
      draggerSelected,
      draggerPosition,
      draggerPositionB,
      isDataCoveragePanelOpen,
      isDraggerDragging,
      isTimelineDragging,
      isAnimationDraggerDragging,
      showHoverLine,
      hoverLinePosition
    } = this.props;
    // check for timeline/animation dragging and showhover handled by parent
    const isNoBlockingDragging = !isTimelineDragging && !isAnimationDraggerDragging;
    const showHover = isNoBlockingDragging && showHoverLine;
    const panelDraggerHoverLine = isDataCoveragePanelOpen && isNoBlockingDragging && isDraggerDragging;

    // 36.33 HEIGHT

    // init normal (no data coverage panel) line heights (svg container, inner line)
    let lineHeight = 63;
    let lineHeightInner = 63;
    let linePosition = hoverLinePosition;

    // handle active layer count dependent tooltip height
    if (isDataCoveragePanelOpen) {
      lineHeight = 111;
      const addHeight = Math.min(activeLayers.length, 5) * 47;
      lineHeight += addHeight;
      lineHeightInner = lineHeight;
    }

    // hoverline positioning based on dragger position
    if (panelDraggerHoverLine) {
      const selectedDraggerPosition = draggerSelected === 'selected' ? draggerPosition : draggerPositionB;
      linePosition = selectedDraggerPosition + 47;
      // lineheight for dragger
      const minusY1Height = Math.min(activeLayers.length, 5) * 47.5;
      lineHeightInner = 47.5 + minusY1Height;
    }

    return (
      // (showHover || panelDraggerHoverLine) &&
      <svg className="axis-hover-line-container" width={axisWidth} height={lineHeight} style={{ zIndex: 6 }}>
        <line className="axis-hover-line"
          stroke="#0f51c0" strokeWidth="2" x1="0" x2="0" y1="0" y2={lineHeightInner}
          transform={`translate(${linePosition + 1}, 0)`}
        />
      </svg>
    );
  }
}

AxisHoverLine.propTypes = {
  activeLayers: PropTypes.array,
  axisWidth: PropTypes.number,
  draggerPosition: PropTypes.number,
  draggerPositionB: PropTypes.number,
  draggerSelected: PropTypes.string,
  hoverLinePosition: PropTypes.number,
  isAnimationDraggerDragging: PropTypes.bool,
  isDataCoveragePanelOpen: PropTypes.bool,
  isDraggerDragging: PropTypes.bool,
  isTimelineDragging: PropTypes.bool,
  showHoverLine: PropTypes.bool
};

export default AxisHoverLine;
