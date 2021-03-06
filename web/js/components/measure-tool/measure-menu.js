import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import React, { Component } from 'react';
import { onToggle } from '../../modules/modal/actions';
import IconList from '../util/list';
import { changeUnits, useGreatCircle } from '../../modules/measure/actions';
import { Form, FormGroup, Label, Input, Tooltip } from 'reactstrap';

const OPTIONS_ARRAY = [
  {
    text: 'Measure distance',
    iconClass: 'ui-icon icon-large fa fa-ruler fa-fw',
    id: 'measure-distance-button',
    key: 'measure-distance'
  },
  {
    text: 'Measure area',
    iconClass: 'ui-icon icon-large fa fa-ruler-combined fa-fw',
    id: 'measure-area-button',
    key: 'measure-area'
  },
  {
    text: 'Remove Measurements',
    iconClass: 'ui-icon icon-large fa fa-trash fa-fw',
    id: 'clear-measurements-button',
    key: 'measure-clear'
  }
];

class MeasureMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showAlert: false,
      tooltipOpen: false,
      useGreatCircleMeasurements: props.useGreatCircleMeasurements
    };
    this.tooltipToggle = this.tooltipToggle.bind(this);
  }

  triggerEvent(eventName) {
    const { map, onCloseModal } = this.props;
    map.ui.events.trigger(eventName);
    onCloseModal();
  }

  unitToggle(evt) {
    const { checked } = evt.target;
    const units = checked ? 'mi' : 'km';
    this.props.onToggleUnits(units);
  }

  useGreatCircle(evt) {
    const { checked } = evt.target;
    this.props.onToggleUseGreatCircle(checked);
  }

  tooltipToggle() {
    this.setState({
      tooltipOpen: !this.state.tooltipOpen
    });
  }

  render() {
    const { isTouchDevice } = this.props;
    const listSize = isTouchDevice ? 'medium' : 'small';
    return (
      <>
        <Form>
          <FormGroup check>
            <Label check>
              <Input
                id="great-circle-toggle"
                type="checkbox"
                onChange={this.useGreatCircle.bind(this)}
                defaultChecked={this.props.useGreatCircleMeasurements}
              />
              {' '} Use Great Circle
            </Label>
            <i id="great-circle-info" className="fas fa-info-circle"></i>
            <Tooltip
              placement="top"
              isOpen={this.state.tooltipOpen}
              target="great-circle-info"
              toggle={this.tooltipToggle}>
              If enabled, lines will be drawn as great circle arcs which represent
              the shortest real world distance between two points.
            </Tooltip>
          </FormGroup>
          <div className="measure-unit-toggle custom-control custom-switch">
            <input
              id="unit-toggle"
              className="custom-control-input"
              type="checkbox"
              onChange={this.unitToggle.bind(this)}
              defaultChecked={this.props.units === 'mi'}/>
            <label className="custom-control-label" htmlFor="unit-toggle">
              {this.props.units}
            </label>
          </div>
        </Form>
        <IconList
          list={OPTIONS_ARRAY}
          onClick={this.triggerEvent.bind(this)}
          size={listSize}
        />
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    isTouchDevice: state.modal.customProps.touchDevice,
    map: state.map,
    units: state.measure.units,
    useGreatCircleMeasurements: state.measure.useGreatCircleMeasurements
  };
};
const mapDispatchToProps = (dispatch, ownProps) => ({
  onToggleUnits: (units) => {
    dispatch(changeUnits(units));
  },
  onToggleUseGreatCircle: (value) => {
    dispatch(useGreatCircle(value));
  },
  onCloseModal: (eventName) => {
    dispatch(onToggle());
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MeasureMenu);

MeasureMenu.propTypes = {
  isTouchDevice: PropTypes.bool,
  map: PropTypes.object,
  onCloseModal: PropTypes.func,
  onToggleUnits: PropTypes.func,
  onToggleUseGreatCircle: PropTypes.func,
  units: PropTypes.string,
  useGreatCircleMeasurements: PropTypes.bool
};
