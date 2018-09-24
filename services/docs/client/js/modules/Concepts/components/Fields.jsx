import React from 'react';
import { Link } from 'react-router-dom';

import C from 'shared-components/Code';


const Fields = () => (
  <div>
    <h1>Fields</h1>
    <p className="leading">
      Which document fields is returned from the API is controlled by the
      <C>fields</C> parameter. Any fields with null values
      (for each document) will be stripped away.
    </p>
    <p className="leading">
      The <C>fields</C> parameter also determines which
      {' '}<Link to="/concepts/relations">related documents</Link> are
      returned.
    </p>

    <h2>Select which fields you want from the API</h2>
    <p>
      If you look at the documentation for each document type, you will see a
      list of available fields. You can control which fields you want by
      listing them in <C>?fields=</C>. For example if you want
      <C>id</C> and <C>name</C> for cabins, you would request
      <C>/cabin?fields=id,name</C>. Multiple fields must be comma
      separated.
    </p>

    <h2>Select related documents</h2>
    <p>
      Most document types has a list of related document types. You can see
      these in the <em>Relations</em> section in the documentation for each
      document type. For example for cabins, you can return the related
      owner group document. <C>/cabin?fields=id,name,owner_group</C> will
      return a list of cabins, and for each cabin the related owner group
      document will be added to the data. You can select multiple relations
      just by adding them to the comma separated fields list.
    </p>


    <h2>Default fields</h2>
    <p>
      Each document type has a list of fields that will be returned by default
      if the <C>fields</C> parameter is not set. You can see these if
      you look for a check mark under the <C>*default</C> column in the
      fields table for each document type.
    </p>
    <p>
      If the <em>Relations</em> section in the documentation for each
      document type, you can see a check mark in the <C>*default</C>
      column if the relation will be returned by default.
    </p>


    <h2>*default</h2>
    <p>
      If you want all the default fields and some extra fields, then you can
      use the magic <C>*default</C> field value.
      <C>?fields=*default,coordinates,updated_at</C> will select all
      the default fields <em>and</em> the <C>coordinates</C> and
      <C>updated_at</C> field.
    </p>
    <p>
      If you want most of the default fields, but not a couple of them, you can
      remove them by adding a <C>-</C> to a field.
      <C>?fields=*default,-coordinates,updated_at</C> would select
      all default fields, but remove the <C>coordinates</C> field
      (Presuming it&apos;s listed as a default field). Then it would add the
      <C>updated_at</C> field.
    </p>
    <p><em>This trick can also be used to add or remove relations.</em></p>
    <p>
      <strong>Note:</strong> the <C>*default</C> magic field value must be
      first in the comma separated list.
    </p>


    <h2>*full</h2>
    <p>
      Each document type has a list of fields that will be returned using the
      magic <C>*full</C> field value. It works like the
      <C>*default</C> field value, just with another list of included
      fields. You can see these if you look for a check mark under the
      <C>*full</C> column in the fields table for each document type.
    </p>
    <p>
      Just like <C>*default</C> it supports adding and removing fields.
      See more under the <C>*default</C> section above.
    </p>
    <p>
      <strong>Note:</strong> the <C>*full</C> magic field value must be
      first in the comma separated list.
    </p>
  </div>
);


export default Fields;
