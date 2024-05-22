import { ModuleMetadata } from '../interfaces';

export const CONTRACT_STANDARDS = ['ERC20', 'ERC721', 'ERC1155'];

/*
 * This list is loosely based on https://wizard.openzeppelin.com
 * It's not exhaustive and can be expanded as needed.
 * For the sake of this assessment, we'll only consider these modules.
 *
 * Can also be a JSON file.
 */
export const AVAILABLE_MODULES: Record<string, ModuleMetadata> = {
    ERC20: {
        import: 'import "@openzeppelin/contracts/token/ERC20/ERC20.sol";',
        inheritance: 'ERC20',
        constructor: {
            params: ['string memory name', 'string memory symbol'],
            body: 'ERC20(name, symbol)',
            placement: 'initialization_list',
        },
        methods: [],
    },
    ERC721: {
        import: 'import "@openzeppelin/contracts/token/ERC721/ERC721.sol";',
        inheritance: 'ERC721',
        constructor: {
            params: ['string memory name', 'string memory symbol'],
            body: 'ERC721(name, symbol)',
            placement: 'initialization_list',
        },
        methods: [],
    },
    ERC1155: {
        import: 'import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";',
        inheritance: 'ERC1155',
        constructor: {
            params: [],
            body: 'ERC1155("")',
            placement: 'initialization_list',
        },
        methods: [],
    },
    ownable: {
        import: 'import "@openzeppelin/contracts/access/Ownable.sol";',
        inheritance: 'Ownable',
        constructor: {
            params: ['address initialOwner'],
            body: 'Ownable(initialOwner);',
            placement: 'body',
        },
        methods: [],
    },
    roles: {
        import: 'import "@openzeppelin/contracts/access/AccessControl.sol";',
        inheritance: 'AccessControl',
        constructor: null,
        methods: [],
    },
    mintable: {
        import: 'import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Mintable.sol";',
        inheritance: 'ERC20Mintable',
        constructor: {
            params: ['address defaultAdmin'],
            body: '_grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);',
            placement: 'body',
        },
        methods: [
            {
                name: 'mint',
                body: `function mint(address to, uint256 amount) public onlyOwner { _mint(to, amount); }`,
            },
        ],
    },
};
