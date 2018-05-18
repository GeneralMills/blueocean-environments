import React from 'react';
import { Link } from 'react-router';

class EnvironmentsLink extends React.Component {

    render() {
        return(    <Link className="environmentsLink"
                           to={`/organizations/${this.props.pipeline.organization}/${encodeURIComponent(this.props.pipeline.fullName)}/environment-info`}
                           title="Environment Information">
                           Environments
                   </Link>
        );
    }
}

export default EnvironmentsLink;