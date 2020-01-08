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
      matchingCoverage: [],
      isMatchingCoverageChecked: false,
      checkedLayerIds: {}
    };
  }

  componentDidMount() {
    this.setActiveLayers();
    // prevent bubbling to parent which the wheel event is blocked for timeline zoom in/out wheel event
    document.querySelector('.timeline-data-panel-container').addEventListener('wheel', (e) => e.stopPropagation(), { passive: false });
  }

  componentDidUpdate(prevProps) {
    const { activeLayers } = this.props;
    // need to update layer toggles for show/hide/remove
    if (!lodashIsEqual(prevProps.activeLayers, activeLayers)) {
      this.setActiveLayers();
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

  closeModal = () => {
    this.props.toggleDataCoveragePanel(false);
  }

  toggleCoverageToFilterPool = (isChecked, layer) => {
    const { matchingCoverage, checkedLayerIds, isMatchingCoverageChecked } = this.state;

    let newMatchingCoverage;
    if (isChecked) {
      // add layer
      const newCoverage = {
        layerId: layer.id,
        startDate: layer.startDate,
        endDate: layer.endDate
      };
      newMatchingCoverage = matchingCoverage.concat(newCoverage);
      checkedLayerIds[layer.id] = true;
    } else {
      // remove toggled layer
      newMatchingCoverage = matchingCoverage.filter((x) => x.layerId !== layer.id);
      delete checkedLayerIds[layer.id];
    }

    this.setState({
      matchingCoverage: newMatchingCoverage,
      checkedLayerIds: checkedLayerIds
    }, () => {
      if (isMatchingCoverageChecked) {
        this.addMatchingCoverageToTimeline(true);
      }
    });
  }

  addMatchingCoverageToTimeline = (isChecked) => {
    let dateRange;
    if (isChecked) {
      dateRange = this.getNewMatchingDatesRange();
    } else {
      dateRange = {};
    }
    this.props.setMatchingTimelineCoverage(dateRange);
    this.setState({
      isMatchingCoverageChecked: isChecked
    });
  }

  // return startDate and endDate based on layers currently selected for matching coverage
  getNewMatchingDatesRange = () => {
    const { matchingCoverage } = this.state;

    let startDate;
    let endDate = new Date(this.props.appNow);
    if (matchingCoverage.length > 0) {
      // get start date
      // for each start date, find latest that is still below end date
      const startDates = matchingCoverage.reduce((acc, x) => {
        return x.startDate ? acc.concat(x.startDate) : acc;
      }, []);
      // console.log(startDates);

      // for each end date, find earlier that is still after start date
      const endDates = matchingCoverage.reduce((acc, x) => {
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
              {/* TODO: Toggle coincident vs all coverage */}
              <Checkbox
                checked={this.state.isMatchingCoverageChecked}
                classNames='wv-checkbox-data-matching-main'
                id='wv-checkbox-data-matching-main'
                label='Show Matching Coverage on Timeline'
                name='wv-checkbox-data-matching-main'
                onCheck={(isChecked) => this.addMatchingCoverageToTimeline(isChecked)}
                inputPosition={'right'}
                title='Show Matching Coverage on Timeline'
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
                  const backgroundColor = enabled ? '#00457B' : 'grey';
                  // get date range to display
                  const dateRangeStart = (layer.startDate && layer.startDate.split('T')[0]) || 'start';
                  const dateRangeEnd = (layer.endDate && layer.endDate.split('T')[0]) || 'present';
                  const dateRange = `${dateRangeStart} - ${dateRangeEnd}`;

                  const isLayerHoveredInSidebar = layer.id === this.props.hoveredLayer;
                  if (isLayerHoveredInSidebar) {
                    console.log('hovered', this.props.hoveredLayer);
                  }
                  return (
                    <div key={index} className={`data-panel-layer-item data-item-${layer.id}`}
                      style={{
                        background: isLayerHoveredInSidebar ? '#474747' : '',
                        outline: isLayerHoveredInSidebar ? '1px solid #858585' : ''
                      }}
                    >
                      <div className="data-panel-layer-item-header">
                        <div className="data-panel-layer-item-title">{layer.title} <span className="data-panel-layer-item-subtitle">{layer.subtitle}</span></div>
                        <Checkbox
                          checked={!!this.state.checkedLayerIds[layer.id]}
                          classNames='wv-checkbox-data-matching-layer'
                          id={`wv-checkbox-data-matching-${layer.id}`}
                          label={dateRange}
                          name={`wv-checkbox-data-matching-${layer.id}`}
                          onCheck={(isChecked) => this.toggleCoverageToFilterPool(isChecked, layer)}
                          inputPosition={'right'}
                          title='Add Layer to Matching Coverage Filter'
                          optionalCaseClassName={'timeline-data-panel-wv-checkbox-container-layer'}
                          optionalLabelClassName={'timeline-data-panel-wv-checkbox-label-layer'}
                        />
                      </div>
                      <div className={`data-panel-layer-coverage-line-container data-line-${layer.id}`} style={{ maxWidth: `${this.props.axisWidth}px` }}>
                        {multipleCoverageRanges
                          ? <div className="data-panel-coverage-line" style={{
                            position: 'relative',
                            width: `${options.width}px`
                          }}>
                            {layer.dateRanges.map((range, index) => {
                              const rangeStart = range.startDate;
                              const rangeEnd = range.endDate;
                              const rangeInterval = Number(range.dateInterval);
                              let rangeOptions;
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

                                return dateIntervalStartDates.map((rangeDate, index) => {
                                  const minYear = rangeDate.getUTCFullYear();
                                  const minMonth = rangeDate.getUTCMonth();
                                  const minDay = rangeDate.getUTCDate();
                                  const rangeDateEnd = new Date(minYear, minMonth, minDay + rangeInterval);
                                  rangeOptions = this.getLineDimensions(layer, rangeDate, rangeDateEnd);

                                  return rangeOptions.visible && (
                                    <div className="data-panel-coverage-line" key={index} style={{
                                      position: 'absolute',
                                      left: rangeOptions.leftOffset,
                                      width: `${rangeOptions.width}px`,
                                      backgroundColor: backgroundColor,
                                      borderRadius: rangeOptions.borderRadius
                                    }}>{rangeDate.toISOString().split('T')[0]}</div>
                                  );
                                });
                              } else {
                                rangeOptions = this.getLineDimensions(layer, rangeStart, rangeEnd);
                                return rangeOptions.visible && (
                                  <div className="data-panel-coverage-line" key={index} style={{
                                    position: 'absolute',
                                    left: rangeOptions.leftOffset,
                                    width: `${rangeOptions.width}px`,
                                    backgroundColor: backgroundColor,
                                    borderRadius: rangeOptions.borderRadius
                                  }}>{rangeStart}</div>
                                );
                              }
                            })}
                          </div>
                          : options.visible && <div className="data-panel-coverage-line" style={{
                            position: 'relative',
                            left: options.leftOffset,
                            width: `${options.width}px`,
                            backgroundColor: backgroundColor,
                            borderRadius: options.borderRadius
                          }}>
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
