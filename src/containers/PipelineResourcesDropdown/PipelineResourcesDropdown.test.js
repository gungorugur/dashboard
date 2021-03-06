/*
Copyright 2019 The Tekton Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from 'react';
import { fireEvent, getNodeText } from 'react-testing-library';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import PipelineResourcesDropdown from './PipelineResourcesDropdown';
import * as API from '../../api';
import { renderWithIntl, rerenderWithIntl } from '../../utils/test';

const props = {
  id: 'pipeline-resources-dropdown'
};

const pipelineResourcesByNamespace = {
  blue: {
    'pipeline-resource-1': 'id-pipeline-resource-1',
    'pipeline-resource-2': 'id-pipeline-resource-2'
  },
  green: {
    'pipeline-resource-3': 'id-pipeline-resource-3'
  }
};

const pipelineResourcesById = {
  'id-pipeline-resource-1': {
    metadata: {
      name: 'pipeline-resource-1',
      namespace: 'blue',
      uid: 'id-pipeline-resource-1'
    },
    spec: { type: 'type-1' }
  },
  'id-pipeline-resource-2': {
    metadata: {
      name: 'pipeline-resource-2',
      namespace: 'blue',
      uid: 'id-pipeline-resource-2'
    },
    spec: { type: 'type-2' }
  },
  'id-pipeline-resource-3': {
    metadata: {
      name: 'pipeline-resource-3',
      namespace: 'green',
      uid: 'id-pipeline-resource-3'
    },
    spec: { type: 'type-1' }
  }
};

const pipelineResourcesStoreDefault = {
  pipelineResources: {
    byId: pipelineResourcesById,
    byNamespace: pipelineResourcesByNamespace,
    isFetching: false
  }
};

const pipelineResourcesStoreFetching = {
  pipelineResources: {
    byId: pipelineResourcesById,
    byNamespace: pipelineResourcesByNamespace,
    isFetching: true
  }
};

const namespacesByName = {
  blue: '',
  green: ''
};

const namespacesStoreBlue = {
  namespaces: {
    byName: namespacesByName,
    selected: 'blue'
  }
};

const namespacesStoreGreen = {
  namespaces: {
    byName: namespacesByName,
    selected: 'green'
  }
};

const namespacesStoreAll = {
  namespaces: {
    byName: namespacesByName,
    selected: '*'
  }
};

const initialTextRegExp = new RegExp('select pipelineresource', 'i');

const checkDropdownItems = ({
  queryByText,
  getAllByText,
  testDict,
  itemPrefixRegExp = new RegExp('pipeline-resource-', 'i')
}) => {
  Object.keys(testDict).forEach(item => {
    expect(queryByText(new RegExp(item, 'i'))).toBeTruthy();
  });
  getAllByText(itemPrefixRegExp).forEach(node => {
    expect(getNodeText(node) in testDict).toBeTruthy();
  });
};

const middleware = [thunk];
const mockStore = configureStore(middleware);

beforeEach(() => {
  jest
    .spyOn(API, 'getPipelineResources')
    .mockImplementation(() => pipelineResourcesById);
});

it('PipelineResourcesDropdown renders items based on Redux state', () => {
  const store = mockStore({
    ...pipelineResourcesStoreDefault,
    ...namespacesStoreBlue,
    notifications: {}
  });
  const { getByPlaceholderText, getAllByText, queryByText } = renderWithIntl(
    <Provider store={store}>
      <PipelineResourcesDropdown {...props} />
    </Provider>
  );
  // View items
  fireEvent.click(getByPlaceholderText(initialTextRegExp));
  checkDropdownItems({
    getAllByText,
    queryByText,
    testDict: pipelineResourcesByNamespace.blue
  });
});

it('PipelineResourcesDropdown renders items based on type', () => {
  const store = mockStore({
    ...pipelineResourcesStoreDefault,
    ...namespacesStoreBlue,
    notifications: {}
  });
  const { getByPlaceholderText, queryByText, rerender } = renderWithIntl(
    <Provider store={store}>
      <PipelineResourcesDropdown {...props} type="type-1" />
    </Provider>
  );
  // View items
  fireEvent.click(getByPlaceholderText(initialTextRegExp));
  expect(queryByText(/pipeline-resource-1/i)).toBeTruthy();
  expect(queryByText(/pipeline-resource-2/i)).toBeFalsy();
  fireEvent.click(getByPlaceholderText(initialTextRegExp));
  rerenderWithIntl(
    rerender,
    <Provider store={store}>
      <PipelineResourcesDropdown {...props} type="type-2" />
    </Provider>
  );
  // View items
  fireEvent.click(getByPlaceholderText(initialTextRegExp));
  expect(queryByText(/pipeline-resource-1/i)).toBeFalsy();
  expect(queryByText(/pipeline-resource-2/i)).toBeTruthy();
});

it('PipelineResourcesDropdown renders items based on Redux state when namespace changes', () => {
  const blueStore = mockStore({
    ...pipelineResourcesStoreDefault,
    ...namespacesStoreBlue,
    notifications: {}
  });
  const {
    getByPlaceholderText,
    getAllByText,
    queryByText,
    rerender
  } = renderWithIntl(
    <Provider store={blueStore}>
      <PipelineResourcesDropdown {...props} />
    </Provider>
  );
  // View items
  fireEvent.click(getByPlaceholderText(initialTextRegExp));
  checkDropdownItems({
    getAllByText,
    queryByText,
    testDict: pipelineResourcesByNamespace.blue
  });
  fireEvent.click(getByPlaceholderText(initialTextRegExp));

  // Change selected namespace from 'blue' to 'green'
  const greenStore = mockStore({
    ...pipelineResourcesStoreDefault,
    ...namespacesStoreGreen,
    notifications: {}
  });
  rerenderWithIntl(
    rerender,
    <Provider store={greenStore}>
      <PipelineResourcesDropdown {...props} />
    </Provider>
  );
  // View items
  fireEvent.click(getByPlaceholderText(initialTextRegExp));
  checkDropdownItems({
    getAllByText,
    queryByText,
    testDict: pipelineResourcesByNamespace.green
  });
});

it('PipelineResourcesDropdown renders controlled selection', () => {
  const store = mockStore({
    ...pipelineResourcesStoreDefault,
    ...namespacesStoreBlue,
    notifications: {}
  });
  // Select item 'pipeline-resource-1'
  const { queryByPlaceholderText, queryByValue, rerender } = renderWithIntl(
    <Provider store={store}>
      <PipelineResourcesDropdown
        {...props}
        selectedItem={{ text: 'pipeline-resource-1' }}
      />
    </Provider>
  );
  expect(queryByValue(/pipeline-resource-1/i)).toBeTruthy();
  // Select item 'pipeline-resource-2'
  rerenderWithIntl(
    rerender,
    <Provider store={store}>
      <PipelineResourcesDropdown
        {...props}
        selectedItem={{ text: 'pipeline-resource-2' }}
      />
    </Provider>
  );
  expect(queryByValue(/pipeline-resource-2/i)).toBeTruthy();
  // No selected item (select item '')
  rerenderWithIntl(
    rerender,
    <Provider store={store}>
      <PipelineResourcesDropdown {...props} selectedItem="" />
    </Provider>
  );
  expect(queryByPlaceholderText(initialTextRegExp)).toBeTruthy();
});

it('PipelineResourcesDropdown renders controlled namespace', () => {
  const store = mockStore({
    ...pipelineResourcesStoreDefault,
    ...namespacesStoreBlue,
    notifications: {}
  });
  // Select namespace 'green'
  const { queryByText, getByPlaceholderText, getAllByText } = renderWithIntl(
    <Provider store={store}>
      <PipelineResourcesDropdown {...props} namespace="green" />
    </Provider>
  );
  fireEvent.click(getByPlaceholderText(initialTextRegExp));
  checkDropdownItems({
    getAllByText,
    queryByText,
    testDict: pipelineResourcesByNamespace.green
  });
});

it('PipelineResourcesDropdown renders empty', () => {
  const store = mockStore({
    pipelineResources: {
      byId: {},
      byNamespace: {},
      isFetching: false
    },
    ...namespacesStoreBlue,
    notifications: {}
  });
  const { queryByPlaceholderText } = renderWithIntl(
    <Provider store={store}>
      <PipelineResourcesDropdown {...props} />
    </Provider>
  );
  expect(
    queryByPlaceholderText(
      /no pipelineresources found in the 'blue' namespace/i
    )
  ).toBeTruthy();
  expect(queryByPlaceholderText(initialTextRegExp)).toBeFalsy();
});

it('PipelineResourcesDropdown renders empty all namespaces', () => {
  const store = mockStore({
    pipelineResources: {
      byId: {},
      byNamespace: {},
      isFetching: false
    },
    ...namespacesStoreAll,
    notifications: {}
  });
  const { queryByPlaceholderText } = renderWithIntl(
    <Provider store={store}>
      <PipelineResourcesDropdown {...props} />
    </Provider>
  );
  expect(queryByPlaceholderText(/no pipelineresources found/i)).toBeTruthy();
  expect(queryByPlaceholderText(initialTextRegExp)).toBeFalsy();
});

it('PipelineResourcesDropdown renders empty with type', () => {
  const store = mockStore({
    pipelineResources: {
      byId: {},
      byNamespace: {},
      isFetching: false
    },
    ...namespacesStoreBlue,
    notifications: {}
  });
  const { queryByPlaceholderText } = renderWithIntl(
    <Provider store={store}>
      <PipelineResourcesDropdown {...props} type="bogus" />
    </Provider>
  );
  expect(
    queryByPlaceholderText(
      /no pipelineresources found of type 'bogus' in the 'blue' namespace/i
    )
  ).toBeTruthy();
  expect(queryByPlaceholderText(initialTextRegExp)).toBeFalsy();
});

it('PipelineResourcesDropdown renders empty with type and all namespaces', () => {
  const store = mockStore({
    pipelineResources: {
      byId: {},
      byNamespace: {},
      isFetching: false
    },
    ...namespacesStoreAll,
    notifications: {}
  });
  const { queryByPlaceholderText } = renderWithIntl(
    <Provider store={store}>
      <PipelineResourcesDropdown {...props} type="bogus" />
    </Provider>
  );
  expect(
    queryByPlaceholderText(/no pipelineresources found of type 'bogus'/i)
  ).toBeTruthy();
  expect(queryByPlaceholderText(initialTextRegExp)).toBeFalsy();
});

it('PipelineResourcesDropdown renders loading skeleton based on Redux state', () => {
  const store = mockStore({
    ...pipelineResourcesStoreFetching,
    ...namespacesStoreBlue,
    notifications: {}
  });
  const { queryByPlaceholderText } = renderWithIntl(
    <Provider store={store}>
      <PipelineResourcesDropdown {...props} />
    </Provider>
  );
  expect(queryByPlaceholderText(initialTextRegExp)).toBeFalsy();
});

it('PipelineResourcesDropdown handles onChange event', () => {
  const store = mockStore({
    ...pipelineResourcesStoreDefault,
    ...namespacesStoreBlue,
    notifications: {}
  });
  const onChange = jest.fn();
  const { getByPlaceholderText, getByText } = renderWithIntl(
    <Provider store={store}>
      <PipelineResourcesDropdown {...props} onChange={onChange} />
    </Provider>
  );
  fireEvent.click(getByPlaceholderText(initialTextRegExp));
  fireEvent.click(getByText(/pipeline-resource-1/i));
  expect(onChange).toHaveBeenCalledTimes(1);
});
