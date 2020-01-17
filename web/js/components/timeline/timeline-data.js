import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import {
  isEqual as lodashIsEqual
} from 'lodash';
import {
  timeScaleOptions
} from '../../modules/date/constants';
import { datesinDateRanges } from '../../modules/layers/util';
import Scrollbars from '../util/scrollbar';
import { Checkbox } from '../util/checkbox';
import { Tooltip } from 'reactstrap';

/*
 * Timeline Data Panel for layer coverage.
 *
 * @class TimelineData
 */

class TimelineData extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeLayers: [],
      isIncludeInactiveLayersChecked: false,
      checkedLayerIds: {},
      hoveredTooltip: {}
    };
  }

  componentDidMount() {
    this.setActiveLayers();
    // prevent bubbling to parent which the wheel event is blocked for timeline zoom in/out wheel event
    document.querySelector('.timeline-data-panel-container').addEventListener('wheel', (e) => e.stopPropagation(), { passive: false });
    // init populate of activeLayers
    this.addMatchingCoverageToTimeline(false, this.props.activeLayers);
  }

  // TODO: seems like a lot of unecesssary updates on map zooms
  // shouldComponentUpdate(nextProps, nextState) {
  //   const { activeLayers, hoveredLayer, appNow, timeScale } = this.props;
  //   console.log(nextProps.appNow, nextProps.hoveredLayer === hoveredLayer, lodashIsEqual(nextProps.activeLayers, activeLayers));
  //   if (nextProps.timeScale === timeScale && lodashIsEqual(nextState.activeLayers, this.state.activeLayers) && nextProps.appNow === appNow && nextProps.hoveredLayer === hoveredLayer && lodashIsEqual(nextProps.activeLayers, activeLayers)) {
  //     return false;
  //   }

  //   return true;
  // }

  componentDidUpdate(prevProps) {
    const { activeLayers } = this.props;
    // need to update layer toggles for show/hide/remove
    if (!lodashIsEqual(prevProps.activeLayers, activeLayers)) {
      // update coverage including layer added/removed and option changes (active/inactive)
      this.setActiveLayers();
      this.addMatchingCoverageToTimeline(this.state.isIncludeInactiveLayersChecked, activeLayers);
      if (activeLayers.length === 0) {
        this.closeModal();
      }
    }
  }

  setActiveLayers = () => {
    const { activeLayers } = this.props;
    this.setState({
      activeLayers
    });
  }

  getLineDimensions = (layer, rangeStart, rangeEnd) => {
    const {
      appNow,
      axisWidth,
      position,
      timeScale,
      timelineStartDateLimit,
      transformX
    } = this.props;
    const postionTransformX = position + transformX;
    const gridWidth = timeScaleOptions[timeScale].timeAxis.gridWidth;
    const frontDate = new Date(this.props.frontDate);
    const backDate = new Date(this.props.backDate);
    let layerStart, layerEnd;
    // console.log(rangeStart, rangeEnd);
    if (rangeStart || layer.startDate) {
      layerStart = new Date(rangeStart || layer.startDate);
    } else {
      layerStart = new Date(timelineStartDateLimit);
    }
    if (rangeEnd || layer.inactive === true) {
      layerEnd = new Date(rangeEnd || layer.endDate);
    } else {
      layerEnd = new Date(appNow);
    }

    let visible = true;
    // console.log(layerStart.toISOString(), backDate.toISOString(), layerEnd.toISOString(), frontDate.toISOString());
    if (layerStart > backDate || layerEnd < frontDate) {
      visible = false;
    }

    let leftOffset = 0;
    let borderRadiusLeft = '0';
    let borderRadiusRight = '0';
    // TODO: temp double value to accomodate backDate/frontDate update delay
    let width = axisWidth * 2;
    if (visible) {
      if (layerStart < frontDate) {
        // console.log(layerStart.toISOString(), frontDate.toISOString());
        leftOffset = 0;
      } else {
        // positive diff means layerStart more recent than frontDate
        const diff = moment.utc(layerStart).diff(frontDate, timeScale, true);
        const gridDiff = gridWidth * diff;
        leftOffset = gridDiff + postionTransformX;
        borderRadiusLeft = '3px';
      }

      if (layerEnd < backDate) {
        // positive diff means layerEnd earlier than back date
        const diff = moment.utc(layerEnd).diff(frontDate, timeScale, true);
        const gridDiff = gridWidth * diff;
        width = gridDiff + postionTransformX - leftOffset;
        borderRadiusRight = '3px';
      }
    }

    const borderRadius = `${borderRadiusLeft} ${borderRadiusRight} ${borderRadiusRight} ${borderRadiusLeft}`;

    return {
      visible: visible,
      leftOffset: leftOffset,
      width: width,
      borderRadius: borderRadius
    };
  }

  hoverOnToolTip = (input) => {
    this.setState({
      hoveredTooltip: { [input]: true }
    });
  }

  hoverOffToolTip = () => {
    this.setState({
      hoveredTooltip: {}
    });
  }

  closeModal = () => {
    this.props.toggleDataCoveragePanel(false);
  }

  // toggleCoverageToFilterPool = (isChecked, layer) => {
  //   const { matchingCoverage, checkedLayerIds, isIncludeInactiveLayersChecked } = this.state;

  //   let newMatchingCoverage;
  //   if (isChecked) {
  //     // add layer
  //     const newCoverage = {
  //       layerId: layer.id,
  //       startDate: layer.startDate,
  //       endDate: layer.endDate
  //     };
  //     newMatchingCoverage = matchingCoverage.concat(newCoverage);
  //     checkedLayerIds[layer.id] = true;
  //   } else {
  //     // remove toggled layer
  //     newMatchingCoverage = matchingCoverage.filter((x) => x.layerId !== layer.id);
  //     delete checkedLayerIds[layer.id];
  //   }

  //   this.setState({
  //     matchingCoverage: newMatchingCoverage,
  //     checkedLayerIds: checkedLayerIds
  //   }, () => {
  //     if (isIncludeInactiveLayersChecked) {
  //       this.addMatchingCoverageToTimeline(true);
  //     }
  //   });
  // }

  addMatchingCoverageToTimeline = (isChecked, layerCollection = this.state.activeLayers) => {
    let dateRange;
    if (isChecked) {
      dateRange = this.getNewMatchingDatesRange(true, layerCollection);
    } else {
      dateRange = this.getNewMatchingDatesRange(false, layerCollection);
    }
    // console.log(dateRange);
    this.props.setMatchingTimelineCoverage(dateRange);
    this.setState({
      isIncludeInactiveLayersChecked: isChecked
    });
  }

  // return startDate and endDate based on layers currently selected for matching coverage
  getNewMatchingDatesRange = (showInactiveCoverageToggle, layerCollection) => {
    const layers = layerCollection.filter(layer => {
      return showInactiveCoverageToggle
        ? layer.startDate
        : layer.startDate && layer.visible;
    });

    let startDate;
    let endDate = new Date(this.props.appNow);
    if (layers.length > 0) {
      // get start date
      // for each start date, find latest that is still below end date
      const startDates = layers.reduce((acc, x) => {
        return x.startDate ? acc.concat(x.startDate) : acc;
      }, []);
      // console.log(startDates);

      // for each end date, find earlier that is still after start date
      const endDates = layers.reduce((acc, x) => {
        return x.endDate ? acc.concat(x.endDate) : acc;
      }, []);
      // console.log(endDates);

      // set as matching end date
      for (let i = 0; i < startDates.length; i++) {
        const date = new Date(startDates[i]);
        if (i === 0) {
          startDate = date;
        }
        if (date.getTime() > startDate.getTime()) {
          startDate = date;
        }
      }
      for (let i = 0; i < endDates.length; i++) {
        const date = new Date(endDates[i]);
        if (i === 0) {
          endDate = date;
        }
        if (date.getTime() < endDate.getTime()) {
          endDate = date;
        }
      }

      // console.log(startDate.toISOString(), endDate.toISOString());
      return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
    }
  }

  render() {
    //! good layer with sporadic coverage for edge cases: GRACE Liquid Water Equivalent Thickness (Mascon, CRI)
    const maxHeightScrollBar = '225px';
    const mainContainerWidth = `${this.props.axisWidth + 78}px`;
    const mainContainerLeftOffset = `${this.props.parentOffset - 10}px`;
    const animateBottomClassName = `${this.props.isDataCoveragePanelOpen ? 'animate-timeline-data-panel-slide-up' : ''}`;
    return (
      <div className={`timeline-data-panel-container ${animateBottomClassName}`} style={{
        left: mainContainerLeftOffset,
        width: mainContainerWidth
      }}>
        {this.props.isDataCoveragePanelOpen &&
          <div className={'timeline-data-panel'} style={{ width: mainContainerWidth }}>
            <header className={'timeline-data-panel-header'}>
              <h3>LAYER COVERAGE</h3>
              <Checkbox
                checked={this.state.isIncludeInactiveLayersChecked}
                classNames='wv-checkbox-data-matching-main'
                id='wv-checkbox-data-matching-main'
                label='Include Inactive Layers'
                name='wv-checkbox-data-matching-main'
                onCheck={(isChecked) => this.addMatchingCoverageToTimeline(isChecked)}
                inputPosition={'right'}
                title='Include Inactive Layers'
                optionalCaseClassName={'timeline-data-panel-wv-checkbox-container'}
                optionalLabelClassName={'timeline-data-panel-wv-checkbox-label'}
              />
              <i className="fa fa-times wv-close" onClick={this.closeModal}/>
            </header>
            <Scrollbars style={{ maxHeight: maxHeightScrollBar }}>
              <div className="data-panel-layer-list">
                {this.state.activeLayers.map((layer, index) => {
                  let multipleCoverageRanges = false;
                  if (layer.dateRanges) {
                    multipleCoverageRanges = layer.dateRanges.length > 1;
                  }

                  const options = this.getLineDimensions(layer);
                  const enabled = layer.visible;
                  const containerBackgroundColor = enabled ? '#ccc' : 'rgba(255, 255, 255, 0.2)';

                  // lighten data panel layer container on sidebar hover
                  const containerHoveredBackgroundColor = enabled ? '#e6e6e6' : 'rgba(255, 255, 255, 0.3)';
                  const backgroundColor = enabled ? '#00457B' : 'rgba(255, 255, 255, 0.2)';
                  const textColor = enabled ? '#222' : '#999';
                  // get date range to display
                  const dateRangeStart = (layer.startDate && layer.startDate.split('T')[0]) || 'start';
                  const dateRangeEnd = (layer.endDate && layer.endDate.split('T')[0]) || 'present';
                  const dateRange = `${dateRangeStart} - ${dateRangeEnd}`;

                  const isLayerHoveredInSidebar = layer.id === this.props.hoveredLayer;
                  const multipleCoverageRangesDateIntervals = {};
                  return (
                    <div key={index} className={`data-panel-layer-item data-item-${layer.id}`}
                      style={{
                        // background: isLayerHoveredInSidebar ? '#474747' : '',
                        background: isLayerHoveredInSidebar ? containerHoveredBackgroundColor : containerBackgroundColor,
                        outline: isLayerHoveredInSidebar ? '1px solid #222' : ''
                      }}
                    >
                      <div className="data-panel-layer-item-header">
                        <div className="data-panel-layer-item-title"
                          style={{
                            color: enabled ? '#000' : '#999'
                          }}>{layer.title} <span
                            className="data-panel-layer-item-subtitle"
                            style={{
                              color: textColor
                            }}>{layer.subtitle}</span></div>
                        <div
                          className="data-panel-layer-item-date-range"
                          style={{
                            color: textColor
                          }}>{dateRange}</div>
                      </div>
                      <div className={`data-panel-layer-coverage-line-container data-line-${layer.id}`} style={{ maxWidth: `${this.props.axisWidth}px` }}>
                        {multipleCoverageRanges
                        // multiple coverage ranges
                          ? <div className="data-panel-coverage-line" style={{
                            position: 'relative',
                            width: `${options.width}px`
                          }}>
                            {layer.dateRanges.map((range, index) => {
                              // console.log(range);
                              const rangeStart = range.startDate;
                              const rangeEnd = range.endDate;
                              const rangeInterval = Number(range.dateInterval);
                              let rangeOptions;
                              // multi day range in DAY timescale
                              // TODO: expand based on what a user can see
                              if (rangeInterval !== 1 && this.props.timeScale === 'day') {
                                const startDateLimit = new Date(this.props.frontDate);
                                let endDateLimit = new Date(this.props.backDate);
                                if (new Date(this.props.appNow) < endDateLimit) {
                                  endDateLimit = new Date(this.props.appNow);
                                }

                                let dateIntervalStartDates = [];
                                if (new Date(rangeStart) < endDateLimit && new Date(rangeEnd) > startDateLimit) {
                                  dateIntervalStartDates = datesinDateRanges(layer, endDateLimit, startDateLimit, endDateLimit);
                                }

                                // add date intervals to object to catch repeats
                                dateIntervalStartDates.forEach((dateInt) => {
                                  const dateIntFormatted = dateInt.toISOString();
                                  multipleCoverageRangesDateIntervals[dateIntFormatted] = dateInt;
                                });

                                // if at the end of dateRanges array, display results from multipleCoverageRangesDateIntervals
                                // TODO: object ordering reliability concerns ?
                                if (index === layer.dateRanges.length - 1) {
                                  const multiDateToDisplay = Object.values(multipleCoverageRangesDateIntervals);
                                  // console.log(multiDateToDisplay);

                                  return multiDateToDisplay.map((rangeDate, index) => {
                                    const minYear = rangeDate.getUTCFullYear();
                                    const minMonth = rangeDate.getUTCMonth();
                                    const minDay = rangeDate.getUTCDate();
                                    const rangeDateEnd = new Date(minYear, minMonth, minDay + rangeInterval);
                                    rangeOptions = this.getLineDimensions(layer, rangeDate, rangeDateEnd);

                                    const cleanRangeStart = rangeDate.toISOString().replace(/[.:]/g, '_');
                                    const cleanRangeEnd = rangeDateEnd.toISOString().replace(/[.:]/g, '_');
                                    const backgroundMulti = index % 2 === 0
                                      ? enabled ? '#00457B' : 'grey'
                                      : enabled ? '#0084eb' : 'grey';

                                    // console.log(`data-coverage-line-${layer.id}-${cleanRangeStart}-${cleanRangeEnd}`);
                                    return rangeOptions.visible && (
                                      <div
                                        id={`data-coverage-line-${layer.id}-${cleanRangeStart}-${cleanRangeEnd}`}
                                        className="data-panel-coverage-line" key={index}
                                        onMouseEnter={() => this.hoverOnToolTip(`${layer.id}-${cleanRangeStart}-${cleanRangeEnd}`)}
                                        onMouseLeave={() => this.hoverOffToolTip()}
                                        style={{
                                          position: 'absolute',
                                          left: rangeOptions.leftOffset,
                                          width: `${rangeOptions.width}px`,
                                          backgroundColor: backgroundMulti,
                                          borderRadius: rangeOptions.borderRadius
                                        }}>
                                        <Tooltip
                                          placement={'auto'}
                                          container={`.data-item-${layer.id}`}
                                          isOpen={this.state.hoveredTooltip[`${layer.id}-${cleanRangeStart}-${cleanRangeEnd}`]}
                                          target={`data-coverage-line-${layer.id}-${cleanRangeStart}-${cleanRangeEnd}`}>
                                          {`${cleanRangeStart.split('T')[0]} to ${cleanRangeEnd.split('T')[0]}`}
                                        </Tooltip>
                                      </div>
                                    );
                                  });
                                // still traversing array and building multipleCoverageRangesDateIntervals object of dates
                                } else {
                                  return null;
                                }
                              // multi day range not in DAY timescale
                              } else {
                                rangeOptions = this.getLineDimensions(layer, rangeStart, rangeEnd);
                                const cleanRangeStart = rangeStart.replace(/:/g, '_');
                                const cleanRangeEnd = rangeEnd.replace(/:/g, '_');

                                return rangeOptions.visible && (
                                  <div
                                    id={`data-coverage-line-${layer.id}-${cleanRangeStart}-${cleanRangeEnd}`}
                                    className="data-panel-coverage-line" key={index}
                                    onMouseEnter={() => this.hoverOnToolTip(`${layer.id}-${cleanRangeStart}-${cleanRangeEnd}`)}
                                    onMouseLeave={() => this.hoverOffToolTip()}
                                    style={{
                                      position: 'absolute',
                                      left: rangeOptions.leftOffset,
                                      width: `${rangeOptions.width}px`,
                                      backgroundColor: backgroundColor,
                                      borderRadius: rangeOptions.borderRadius
                                    }}>
                                    <Tooltip
                                      placement={'auto'}
                                      isOpen={this.state.hoveredTooltip[`${layer.id}-${cleanRangeStart}-${cleanRangeEnd}`]}
                                      target={`data-coverage-line-${layer.id}-${cleanRangeStart}-${cleanRangeEnd}`}>
                                      {`${cleanRangeStart.split('T')[0]} to ${cleanRangeEnd.split('T')[0]}`}
                                    </Tooltip>
                                  </div>
                                );
                              }
                            })}
                          </div>
                          // single start -> end date range
                          : options.visible && <div
                            id={`data-coverage-line-${layer.id}-${dateRangeStart}-${dateRangeEnd}`}
                            className="data-panel-coverage-line"
                            onMouseEnter={() => this.hoverOnToolTip(`${layer.id}-${dateRangeStart}-${dateRangeEnd}`)}
                            onMouseLeave={() => this.hoverOffToolTip()}
                            style={{
                              position: 'relative',
                              left: options.leftOffset,
                              width: `${options.width}px`,
                              backgroundColor: backgroundColor,
                              borderRadius: options.borderRadius
                            }}>
                            <Tooltip
                              placement={'auto'}
                              isOpen={this.state.hoveredTooltip[`${layer.id}-${dateRangeStart}-${dateRangeEnd}`]}
                              target={`data-coverage-line-${layer.id}-${dateRangeStart}-${dateRangeEnd}`}>
                              {`${dateRangeStart} to ${dateRangeEnd}`}
                            </Tooltip>
                          </div>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </Scrollbars>
          </div>
        }
      </div>
    );
  }
}

function mapStateToProps(state) {
  const {
    compare,
    layers,
    date
  } = state;
  const {
    appNow
  } = date;

  const activeLayers = layers[compare.activeString].filter(activeLayer => activeLayer.startDate);
  const hoveredLayer = layers.hoveredLayer;

  return {
    activeLayers,
    hoveredLayer,
    appNow
  };
}

const mapDispatchToProps = dispatch => ({
});

TimelineData.propTypes = {
  activeLayers: PropTypes.array,
  appNow: PropTypes.object,
  axisWidth: PropTypes.number,
  backDate: PropTypes.string,
  frontDate: PropTypes.string,
  hoveredLayer: PropTypes.string,
  isDataCoveragePanelOpen: PropTypes.bool,
  matchingTimelineCoverage: PropTypes.object,
  parentOffset: PropTypes.number,
  position: PropTypes.number,
  setMatchingTimelineCoverage: PropTypes.func,
  timelineStartDateLimit: PropTypes.string,
  timeScale: PropTypes.string,
  toggleDataCoveragePanel: PropTypes.func,
  transformX: PropTypes.number
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TimelineData);
